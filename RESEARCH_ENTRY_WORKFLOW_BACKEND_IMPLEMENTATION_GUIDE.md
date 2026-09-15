# Archived workflow document

This document is obsolete and is retained only as a historical reference.

The current repository no longer includes:
- approval-sheet storage or approval-sheet workflow logic
- student-edit access to research entries
- student invitation-based research editing flows

The live code, policies, tests, and current UI are the source of truth. Any old workflow diagrams or implementation notes are intentionally retired and should not be treated as active requirements.
| `hardDelete`        | Staff only; eligible original Draft or eligible Archived record.                                                                    |
| `view`              | Public for Posted; linked student for their own active/posted record; Faculty owner; Staff.                                         |

Avoid using a broad `update()` policy for all operations. Controllers should call a specific ability, e.g. `$this->authorize('sendInvitations', $research)`.

## 7. Requests and validation

Create or extend these request classes.

### 7.1 `UpdateResearchRequest`

Validate the form fields and add:

```php
'updated_at' => ['required', 'date'],
'invitation_action' => ['nullable', Rule::in(['save_only', 'send_invitations'])],
'researchers' => ['array', 'min:1'],
'researchers.*.id' => ['nullable', 'integer'],
'researchers.*.email' => ['nullable', 'email:rfc,dns'],
'researchers.*.is_lead_author' => ['boolean'],
```

Enforce at most one Lead Author after normalizing the submitted list. Do not require emails for posting; require them only when the selected action sends an invitation.

### 7.2 `SendInitialResearchInvitationsRequest`

Create a dedicated request for the initial button. It should require:

- Faculty authorization;
- current status `draft`;
- Faculty-created/student-collaboration-enabled record;
- at least one researcher;
- valid email for every listed researcher;
- optional `version` for optimistic concurrency.

### 7.3 `HardDeleteResearchRequest`

Extend the current request:

```php
'reason' => ['required', 'string', 'max:1000'],
'confirmation' => ['required', 'in:DELETE'],
```

The request authorizes only Staff, but the action performs final eligibility checks.

### 7.4 Status requests

`TransitionResearchStatusRequest` should accept only configured target statuses and a required `note` for Return for Revision. Archive requires `reason`; adviser reassignment needs the new active Faculty ID.

## 8. Invitation and access services

### 8.1 Replace automatic invitation sending

Current `ResearchController::syncResearchers()` sends email immediately when an email changes or a researcher is created. Remove that behavior.

Split the work into services:

```text
ResearcherChangeDetector
  → compares saved and submitted researcher lists
  → returns a ResearcherChangeSummary

ResearcherAccessService
  → applies researcher additions/updates/removals
  → revokes old invitations and user access

ResearchInvitationService
  → creates only explicit, new invitation rows
  → validates/accepts/revokes tokens

ResearchSaveDecisionService
  → coordinates preview and confirmed save in a transaction
```

### 8.2 Change-summary contract

Return a stable data structure to Inertia/API clients:

```php
[
    'decision_required' => true,
    'added' => [['researcher_id' => null, 'name' => 'Ana Cruz', 'email' => 'ana@example.edu']],
    'changed_emails' => [['researcher_id' => 21, 'name' => 'Juan Cruz', 'old_email' => 'old@example.edu', 'new_email' => 'new@example.edu']],
    'removed' => [['researcher_id' => 22, 'name' => 'Maria Santos', 'had_access' => true]],
    'expired' => [['researcher_id' => 23, 'name' => 'Leo Reyes', 'email' => 'leo@example.edu']],
    'archive_revoked' => [['researcher_id' => 24, 'name' => 'Ana Cruz', 'email' => 'ana@example.edu']],
]
```

If `removed` is the only non-empty group, return a removal confirmation rather than the invitation-choice modal.

### 8.3 Two-step save

1. Frontend submits the full edit form with no `invitation_action`.
2. Backend recomputes the summary from the database. If a decision is needed, return a structured `invitation_decision_required` response without writing changes.
3. Frontend displays either the removal confirmation or the consolidated modal.
4. Frontend resubmits the unchanged form plus `save_only` or `send_invitations`.
5. Backend recomputes the summary again, validates the version, and performs the transaction.

Never trust a summary calculated only in the browser.

### 8.4 Transaction rules

Inside `DB::transaction()`:

1. Lock the research row (`lockForUpdate`) and verify the version.
2. Apply field changes and relationships.
3. For a changed email, revoke pending invitations and clear `researcher.user_id` before saving the new email.
4. For a removed researcher, revoke pending invitations and clear access before deletion.
5. If `send_invitations` was selected, create invitation rows only for added, corrected, expired, or archive-revoked candidates.
6. Transition `draft → draft_invited` when an initial/fresh invitation round is sent from Draft.
7. Write Research Entry Logs from the actual changed values.
8. Dispatch mail only with `DB::afterCommit()`.

### 8.5 Accept invitation

On an invitation URL:

1. Locate the token hash and require pending, unrevoked, unexpired invitation.
2. Complete sign-in/profile setup.
3. Require the signed-in email to match `email_snapshot` case-insensitively.
4. Confirm the research is student-collaboration-enabled and not Archived/Posted.
5. In a transaction, set `accepted_at`, set `researchers.user_id` to the signed-in user ID, and log `researcher_invitation_accepted`.
6. Redirect to My Research. The page is read-only if the status is Submitted.

## 9. Workflow actions and controllers

Keep controllers thin. They authorize, validate, call an action/service, and return an Inertia or JSON response.

### Required actions

| Action                                       | Responsibility                                                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `SendInitialResearchInvitationsAction`     | Validate Draft eligibility, create invitations, transition to Draft Invited, log, queue mail.                        |
| `SaveResearchWithInvitationDecisionAction` | Preview/confirm edit saves and handle the modal decision.                                                            |
| `SubmitForReviewAction`                    | Ensure linked student/Lead Author eligibility, checklist requirements, transition to Submitted, log, notify Faculty. |
| `ReturnForRevisionAction`                  | Require note, transition Submitted → Returned, log, notify linked researchers.                                      |
| `PostResearchAction`                       | Validate posting checklist and legacy markers, transition to Posted, optionally queue notifications.                 |
| `ArchiveResearchAction`                    | Require reason, revoke all pending invitations and all student access, transition to Archived, log.                  |
| `RestoreResearchAction`                    | Staff only, conflict-check title, transition Archived → Draft, log. Do not restore links/access.                    |
| `HardDeleteResearchAction`                 | Check eligibility, require DELETE confirmation, write deletion snapshot log, then delete().                      |
| `ReassignResearchAdviserAction`            | Validate active Faculty, update adviser, log, remove old adviser authorization.                                      |
| `MarkLegacyUnavailableAction`              | Staff only; set one eligible marker, log.                                                                            |

### Controller endpoints

Use conventional, explicit routes such as:

```php
Route::post('/research/{research}/invitations/initial', ...)->name('research.invitations.initial');
Route::put('/research/{research}', ...)->name('research.update');
Route::post('/research/{research}/submit', ...)->name('research.submit');
Route::post('/research/{research}/return', ...)->name('research.return');
Route::post('/research/{research}/post', ...)->name('research.post');
Route::post('/research/{research}/archive', ...)->name('research.archive');
Route::post('/research/{research}/restore', ...)->name('research.restore');
Route::delete('/research/{research}/hard-delete', ...)->name('research.hard-delete');
Route::get('/research/invitations/{token}', ...)->name('research.invitations.accept');
```

Apply `auth`, role middleware where appropriate, and `EnsureProfileCompleted` to the invitation acceptance completion route. Do not rely on middleware alone; every action must still authorize the record.

## 10. Posting requirements and legacy rules

Put the authoritative posting check in one `ResearchPostingReadinessService`, not only `config('research.publish_requirements')`.

It should return a structured result:

```php
[
    'ready' => false,
    'missing' => ['abstract', 'approval_sheet'],
    'legacy_satisfied' => ['panelists'],
]
```

Check title, program, abstract, completed date, adviser, one or more researchers, keywords, Agenda, SDG, SRIG, panelists, approval sheet, and manuscript. Treat only Staff legacy markers as valid substitutes for manuscript, approval sheet, and panelists.

Use this service in the post action, disabled-button response, API validation, and tests.

## 11. Logs, events, observers, and listeners

### Research Entry Log action names

Add constants for workflow events:

```php
ACTION_SEND_INITIAL_INVITATIONS
ACTION_SEND_RESEARCHER_INVITATIONS
ACTION_REVOKE_RESEARCHER_ACCESS
ACTION_ACCEPT_RESEARCHER_INVITATION
ACTION_MARK_LEGACY_UNAVAILABLE
ACTION_REASSIGN_ADVISER
ACTION_HARD_DELETE
```

Use `metadata` for invitation recipient IDs, field names, reason/note, and a safe deletion snapshot. Do not log raw invitation tokens.

### Events

Dispatch domain events only after successful actions:

```text
ResearcherInvitationsSent
ResearcherAccessRevoked
ResearcherInvitationAccepted
ResearchSubmittedForReview
ResearchReturnedForRevision
ResearchPosted
ResearchArchived
ResearchRestored
ResearchHardDeleted
```

Listeners should queue mail and non-critical notifications. State changes and audit logs stay in the action transaction.

### Observers

Keep `ResearchObserver` for ordinary audit behavior only. Do not use an observer to send invitation email or infer permissions; those rules need the explicit actor and modal decision available in actions/services.

## 12. Mail and notifications

Use queued mail sent after transaction commit.

| Mail                      | Trigger                    | Recipient            | Required content                                                   |
| ------------------------- | -------------------------- | -------------------- | ------------------------------------------------------------------ |
| `ResearcherInvitedMail` | Explicit invitation action | Candidate researcher | Accept link, research title, expiry, current edit/read-only state. |
| `ResearchSubmittedMail` | Student submits            | Faculty adviser      | Research link and submitter.                                       |
| `ResearchReturnedMail`  | Faculty returns            | Linked students      | Required revision note.                                            |
| `ResearchPostedMail` | Optional post notification | Linked researchers   | View-only congratulatory message.                                  |

If a Submitted record receives a new invitation, the invitation email must state that the research is under review and currently read-only.

Mail delivery failure must log `notification_undeliverable` without rolling back a successful post or save.

## 13. Repository, service, support, and traits

### `ResearchRepository`

Create purpose-specific loaders to prevent N+1 queries:

```php
findForEdit(int $id): Research;
findForStudent(int $id, int $userId): Research;
findForReview(int $id): Research;
findWithInvitationState(int $id): Research;
```

Eager-load researchers, their invitations, `user`, adviser, classifications, panelists, and necessary logs.

### `ResearchService`

Keep broad read/search/report behavior here. Move write-side workflow rules to actions and specialized services so `ResearchService` does not become a second controller.

### `ResearchStatusConfig`

Expose methods such as `canTransition`, `statusLabel`, `badgeColor`, and `isPublic`. It must accept the new `draft_invited` and `posted` statuses.

### Traits

- Keep `NormalizesEmail` on `Researcher`; normalize before comparison so `User@Example.edu` and `user@example.edu` are the same invitation target.
- Keep `ResearchScopes` for public/status filtering; update it from `published` to `posted`.
- Do not put workflow authorization or email-sending behavior in traits.

## 14. My Research and access queries

My Research must be based on linked researcher rows, not only email addresses:

```php
Research::query()
    ->whereHas('researchers', fn ($query) => $query->where('user_id', auth()->id()))
    ->where('student_collaboration_enabled', true)
    ->whereIn('status', ['draft_invited', 'submitted', 'returned', 'posted'])
    ->get();
```

The frontend must receive explicit capability flags from the backend:

```php
[
    'can_view' => true,
    'can_edit' => false,
    'can_submit' => false,
    'read_only_reason' => 'This research is under Faculty review.',
]
```

Never determine student edit access only by hiding fields in the frontend.

## 15. Tests

Add feature tests for every policy and transition, plus unit tests for invitation/status services.

### Required feature tests

- Faculty can create an original Draft and post directly when complete.
- Initial invite changes Draft to Draft Invited and does not duplicate invitations.
- Draft Invited/Submitted/Returned save previews the correct modal candidates.
- `save_only` revokes obsolete access without sending mail.
- `send_invitations` sends only affected addresses.
- Submitted invitation acceptance gives My Research read-only access.
- Returned status enables the linked student to edit and submit.
- Changing accepted email clears `researchers.user_id` and invalidates the old token.
- Removing a researcher requires confirmation and removes access.
- Archive revokes pending links and all linked `user_id` values.
- Restore returns to Draft; old links remain invalid; fresh invitations move it to Draft Invited.
- Staff-created records never send invitations or allow student edit access.
- Posting blocks missing required fields and accepts only Staff legacy markers.
- Concurrent non-overlapping edits merge; overlapping edits require Compare Changes.
- Faculty cannot hard-delete.
- Staff can hard-delete only an eligible original Draft or eligible Archived record after retention.
- Hard delete leaves the snapshot Research Entry Log with `target_research_id = null`.

### Test utilities

- Use `Mail::fake()`, `Event::fake()`, and `Queue::fake()`.
- Use `Carbon::setTestNow()` for seven-day invitation expiry and retention-period tests.
- Add factories for active, expired, accepted, and revoked invitation states.

## 16. Implementation order

1. Add migrations and model relationships/helpers.
2. Update `ResearchStatus`, `config/research.php`, scopes, and status comparisons from published to posted.
3. Implement `ResearchPostingReadinessService` and add validation tests.
4. Refactor policies and capability serialization.
5. Refactor invitation/access services and remove automatic mail from `syncResearchers()`.
6. Implement modal preview/confirm save flow and its routes/requests.
7. Update archive, restore, hard-delete, submit, return, and post actions.
8. Add queued events/listeners/mail and audit logs.
9. Update repositories/My Research queries and frontend capability consumption.
10. Run the complete feature/unit test suite, then perform manual role-based acceptance testing.

## 17. Acceptance checklist

Before release, verify all of the following in a non-production environment:

- No API can send an invitation without a Faculty authorization and explicit send decision.
- No old invitation token works after email change, removal, posting, or archive.
- No student can edit based only on an email match; a linked `user_id` and status permission are both required.
- A restored record has no student access until Faculty explicitly sends new invitations.
- Posted content is public; My Research remains view-only for linked students.
- Staff-created records cannot enter the student invitation workflow.
- All irreversible actions are logged, including hard delete snapshots.
- All status transitions are checked in both policy/action code and automated tests.

## 18. VS Code Copilot implementation prompts

Use the prompts below in VS Code Copilot Chat with the workspace open. Give Copilot one phase at a time, review the resulting diff, run the named tests, then continue. Do not ask Copilot to implement the entire guide in one request.

### Start here: prompt order

Copy the prompts in this order:

1. **18.1 Master context prompt** — paste it once to establish the rules.
2. **18.2 Phase 1** — status/config/enum/model changes.
3. **18.3 Phase 2** — migration and relationship changes. Review the migration diff before rebuilding the database.
4. Run `php artisan migrate:fresh --seed` only against the local development database, then run the Phase 2 tests.
5. **18.4 Phase 3** — policies and access queries.
6. **18.5 Phase 4** — invitation and access services.
7. **18.6 Phase 5** — save-decision modal backend contract.
8. **18.7 Phase 6** — workflow actions, logs, events, and mail.
9. **18.8 Phase 7** — hard delete.
10. Run the complete backend test suite and fix failures before using **18.9 Phase 8** for frontend integration.

`migrate:fresh --seed` deletes and rebuilds the local database. Do not run it against any database containing data you need to keep.

### 18.1 Master context prompt

Paste this once at the beginning of the Copilot conversation:

```text
You are implementing the research-entry workflow in this Laravel repository.

First read these two files completely:
- FINAL_RESEARCH_ENTRY_WORKFLOW.md
- RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md

Treat FINAL_RESEARCH_ENTRY_WORKFLOW.md as the product specification and the implementation guide as the technical plan. Preserve unrelated user changes. This project is still in development: edit the existing source migrations directly when a schema change is needed, then run php artisan migrate:fresh --seed against the local development database. Do not use this migration-editing approach for shared, staging, or production data. Do not add a database enum for status values.

Important workflow rules:
- Statuses are draft, draft_invited, submitted, returned, posted, and archived.
- draft_invited is a configured status, not a new database column.
- Faculty alone sends student-completion invitations; Staff never sends them.
- The initial invitation action changes draft to draft_invited.
- Faculty researcher edits after the initial round use a Save Only / Save & Send Invitations decision modal.
- Archive revokes pending invitations and researcher user_id access. Restore returns to draft and does not revive old links.
- Researchers are linked through researchers.user_id only after accepting a valid invitation with a matching signed-in email.
- Hard delete writes a snapshot to research_entry_logs before deleting. Research does not use SoftDeletes, so use delete(), not forceDelete().

Before editing, list the files you will change and identify any mismatch between this specification and the current code. Implement only the phase I request. After editing, report changed files, explain the behavior, and run focused tests or static checks. Do not change frontend files unless the phase explicitly asks for it.
```

### 18.2 Phase 1 — status configuration, enum, and model

```text
Implement Phase 1 of RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md: status configuration, enum, and Research model support.

Inspect and update only the files needed among:
- config/research.php
- app/Enums/ResearchStatus.php
- app/Support/ResearchStatusConfig.php
- app/Models/Research.php
- app/Traits/ResearchScopes.php
- relevant status-only tests

Replace the published status value with posted consistently. Add draft_invited as a configured status. Restore must return archived records to draft. Add the required transitions from the implementation guide. Keep archive as a status transition; do not introduce SoftDeletes or a database enum.

Search for existing references to published/PUBLISHED and report every remaining reference that must be migrated in later phases. Do not modify controllers, invitations, or frontend code yet. Add or update focused tests for the status config and model restore behavior.
```

### 18.3 Phase 2 — migrations and model relationships

```text
Implement Phase 2 of RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md: schema additions and model relationships.

This project is still in development. Edit the existing source migrations that define the affected tables, then run `php artisan migrate:fresh --seed` locally after the changes. Do not create follow-up migrations for these workflow schema changes.

Required work:
- Add researches.student_collaboration_enabled, default true.
- Add the recommended invitation-state index if it does not already exist.
- Add explicit legacy-unavailable marker fields for manuscript, approval sheet, and panelists, including nullable Staff actor foreign keys.
- Add Researcher::user() and any required casts/fillable fields.
- Add safe Researcher and ResearcherInvitation helper methods described in the guide.

Do not add invitations_sent, draft_restored, needs_reinvitation, a duplicate research_id on invitations, or a database enum. Do not alter existing user data.

Show the migration names and explain how down() reverses each migration. Add model-level tests where appropriate.
```

### 18.4 Phase 3 — policies, capabilities, and access queries

```text
Implement Phase 3 of RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md: authorization policies and My Research access queries.

Inspect and update only policy, authorization, repository/service query, and test files needed for these rules:
- Faculty manages own advised Faculty-created entries in draft, draft_invited, submitted, and returned.
- Faculty alone can send student invitations for student-collaboration-enabled records.
- Linked students edit only in draft_invited and returned.
- Linked students can view submitted and posted entries in My Research but they are read-only.
- Staff has administrative edit access; Staff never sends student invitations.
- Staff-created records never give students edit access.
- Public users see only posted records.

Add specific policy abilities rather than relying only on a broad update ability. Ensure authorization checks researchers.user_id, never email address alone. Do not implement invitation sending or controller updates yet.
```

### 18.5 Phase 4 — invitation and access services

```text
Implement Phase 4 of RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md: invitation and researcher-access services.

Inspect these existing files first:
- app/Services/ResearchInvitationService.php
- app/Services/ResearchMailService.php
- app/Models/Researcher.php
- app/Models/ResearcherInvitation.php
- app/Http/Controllers/ResearchController.php

Create or refactor services so the backend can:
- classify invitation rows as active, expired, accepted, or revoked;
- create a fresh invitation row instead of overwriting historical expired/revoked rows;
- revoke pending invitations;
- revoke accepted edit access by clearing researchers.user_id;
- accept an invitation only after validating the token, expiry, collaboration setting, research status, and matching signed-in email;
- produce a server-calculated change summary for added researchers, changed emails, removals, expired invitations, and archive-revoked access.

Remove automatic invitation email sending from researcher synchronization. Do not send mail inside model observers. Add focused unit tests for each invitation state and access revocation case.
```

### 18.6 Phase 5 — save-decision modal backend contract

```text
Implement Phase 5 of RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md: the backend contract for Save Only / Save & Send Invitations.

Add the required request validation, action/service, controller behavior, and routes. The first save request must calculate changes from the database and return a structured invitation_decision_required response without writing. The confirmed request must recompute the summary, enforce optimistic concurrency, apply changes in one transaction, write audit logs, and queue email after commit.

Rules:
- Removal-only changes return a confirmation with no invitation choice.
- Added emails, changed emails, expired invitations, and archive-revoked researchers can use Save Only or Save & Send Invitations.
- Initial invitations from a new draft use the dedicated initial-invite action and transition to draft_invited.
- Fresh invitations from a restored draft also transition it to draft_invited.
- The same modal may run while submitted, but linked students remain read-only until returned.

Do not implement the visual modal itself. Return a stable JSON/Inertia payload that the frontend can render. Add feature tests for preview, save_only, send_invitations, removal-only, and version-conflict responses.
```

### 18.7 Phase 6 — workflow actions and notifications

```text
Implement Phase 6 of RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md: workflow actions, logging, events, and queued mail.

Update or create the actions for initial invitations, submit, return for revision, post, archive, restore, hard delete, adviser reassignment, and legacy-unavailable markers.

Requirements:
- Archive requires a reason, revokes pending invitations, clears every linked researchers.user_id, and logs the action.
- Restore is Staff-only, checks title conflict, returns to draft, logs the action, and does not restore invitations/access.
- Return requires a note and notifies linked students.
- Post uses one posting-readiness service and optionally sends a view-only notification.
- Notification failures must log but never roll back a completed workflow action.
- Dispatch events/mail after commit.
- Add explicit ResearchEntryLog action constants; never log raw invitation tokens.

Do not change unrelated user/audit workflows. Add action and feature tests for each transition.
```

### 18.8 Phase 7 — hard delete

```text
Implement Phase 7 of RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md: safe hard deletion.

Inspect:
- app/Http/Actions/Research/HardDeleteResearchAction.php
- app/Http/Requests/HardDeleteResearchRequest.php
- app/Policies/ResearchPolicy.php
- app/Models/Research.php
- database/migrations/2025_10_15_174701_research_entry_log.php

Implement these rules:
- Faculty can never hard-delete.
- Staff can hard-delete only an original draft with no invitation/access history, or an archived record after the configured retention period.
- Require reason and confirmation exactly equal to DELETE.
- Before deleting, write ResearchEntryLog::ACTION_HARD_DELETE with original research ID, title, prior status, reason, researcher count, and file count in old_values or metadata.
- Preserve research_entry_logs through the existing target_research_id nullOnDelete foreign key.
- Research is not a SoftDeletes model: use delete(), not forceDelete().

Make the action transactional and add feature tests proving the log remains after deletion with target_research_id set to null.
```

### 18.9 Phase 8 — frontend handoff prompt

Use this only after the backend phases are complete:

```text
Implement the frontend integration for the completed research-entry workflow backend.

Read FINAL_RESEARCH_ENTRY_WORKFLOW.md and the backend response contracts first. Do not duplicate authorization in the frontend; render server-provided capability flags and handle server errors.

Implement:
- status badges for draft, draft_invited, submitted, returned, posted, archived;
- initial Invite Researchers confirmation for a newly created Draft only;
- Save Only / Save & Send Invitations modal using the backend summary payload;
- removal-only confirmation;
- read-only submitted banner for linked students;
- My Research read-only labels for submitted and posted entries;
- hard-delete reason and DELETE confirmation for authorized Staff only;
- clear validation, conflict, and invalid-invitation messages.

Keep the existing design system and do not change unrelated pages. List every component/page changed and add/update relevant frontend tests.
```
