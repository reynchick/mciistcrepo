# Archived workflow document

This document is obsolete and is retained only as a historical reference.

The current repository no longer includes:
- approval-sheet storage or approval-sheet workflow logic
- student-edit access to research entries
- student invitation-based research editing flows

The live code, policies, tests, and current UI are the source of truth. Any old workflow diagrams or implementation notes are intentionally retired and should not be treated as active requirements.

- research title;
- current status badge;
- `Edit`, `Submit for Review`, or `View only` based only on capabilities;
- a concise reason for read-only status;
- no researcher-management, archive, or Staff actions.

Do not show Archived entries to students because archive revokes their linked access.

### 5.5 Staff and Faculty pages

Update the existing `resources/js/pages/staff/research/index.tsx` and `resources/js/pages/faculty/research/index.tsx` to use the shared status filter options. Staff list/detail pages should expose support actions only when capabilities permit them.

## 6. Research form and save-decision flow

`resources/js/components/research/research-form/index.tsx` is the main integration point.

### 6.1 Form permissions

Pass field-level capabilities into every form section:

```ts
type ResearchFormCapabilities = Pick<ResearchCapabilities,
  'canEdit' | 'canManageResearchers' | 'canSendInitialInvitations' |
  'canUseInvitationSaveDecision' | 'canPost'>
```

- Disable all editing when `canEdit` is false.
- Disable or hide the Researchers section controls when `canManageResearchers` is false.
- Students must never receive controls for program, adviser, uploader, researcher list, or Lead Author.
- Do not use `auth.user.role` as the source of field permissions; use capability props.

### 6.2 Client validation

Keep client validation helpful but not authoritative:

- validate title/program/abstract/researcher presence for immediate feedback;
- validate email format only for researcher rows with an email;
- do not require every researcher email merely to save or post;
- require valid emails only when the backend enables/sends initial invitations;
- allow zero Lead Author or exactly one Lead Author;
- show backend validation errors next to the appropriate field;
- keep full posting readiness from the backend as the source for Post button state and missing-field list.

The existing form currently validates every researcher email and requires files during create. Reconcile that behavior with the final workflow: Draft save must remain possible with incomplete data.

### 6.3 Save request contract

The frontend must preserve the full form data—including file inputs and `updated_at`—across the two-step save decision.

Recommended sequence:

1. User presses Save Draft/Save Changes.
2. Submit FormData with no `invitation_action`.
3. If backend returns `invitation_decision_required`, do not discard form state; open `ResearchSaveDecisionModal` with the structured summary.
4. When the user chooses Save Only or Save & Send Invitations, resubmit the exact same FormData plus `invitation_action`.
5. On success, close the modal, clear local draft state, and reload/replace the Inertia page with fresh server capabilities and `updated_at`.
6. On a version conflict, retain form data and open the existing/new Compare Changes UI rather than silently reloading.

Use the existing `buildSaveFormData()` approach as a starting point, but move it into a reusable `useResearchSave` hook so the form and workflow action card cannot send inconsistent payloads.

### 6.4 Restored Draft

When `workflow.isRestoredDraft` is true:

- hide the regular initial Invite Researchers button;
- retain Save Draft and Post controls;
- let the backend trigger the consolidated modal on the next save;
- do not add a `draft_restored` frontend status.

### 6.5 Local storage drafts

The existing form stores drafts in `localStorage`. Keep it only for unsent form content.

- never store File objects, invitation summaries, access details, or raw server errors;
- clear it only after a successful persisted save;
- prompt before restoring a local draft if its `updated_at` differs from the server version;
- namespace it by research ID and authenticated user ID to avoid shared-device leakage.

## 7. Components

### 7.1 `ResearchSaveDecisionModal`

Update the existing component rather than creating a competing modal.

It must render separate, labeled groups:

- **New researchers to invite**
- **Changed email addresses**
- **Expired invitations**
- **Access revoked by archive**
- **Removed researchers**

Required copy:

- changed email: “The previous email’s invitation and edit access will be revoked.”
- removed researcher: “This researcher will lose access to this research.”
- submitted record: “This research is under Faculty review. Newly invited researchers can view it, but cannot edit until it is returned for revision.”
- restored Draft: “Previous researcher access was revoked when this research was archived.”

Variants:

| Variant                  | Buttons                                    |
| ------------------------ | ------------------------------------------ |
| Removal only             | Cancel, Save Changes                       |
| Any invitation candidate | Cancel, Save Only, Save & Send Invitations |

The modal must trap focus, support Escape/close only when not processing, use semantic dialog labels, and never display invitation tokens.

### 7.2 Initial invitation confirmation

Create `resources/js/components/modals/initial-research-invitation-modal.tsx` only if an existing generic confirmation modal cannot render the recipient list.

It lists all recipients, provides Cancel and Send Invitations, and is available only when `canSendInitialInvitations` is true.

### 7.3 Workflow action panel

Refactor `resources/js/components/research/workflow-actions.tsx`:

- accept typed capabilities and routes;
- do not determine actions from `currentRole` plus status alone;
- show initial Invite Researchers only from `canSendInitialInvitations`;
- do not open the save-decision modal here unless the same form payload is available; keep it owned by `ResearchForm`;
- render Submit, Return, Post, Archive, Restore, and Hard Delete only through capabilities;
- show disabled action explanations from backend `postingReadiness.missing` when provided;
- replace any stale `/invite`, `/publish`, or `/force-delete` route assumptions with the confirmed route helpers.

### 7.4 Hard-delete dialog

Extend `resources/js/components/modals/workflow-note-modal.tsx` or create a focused `hard-delete-research-modal.tsx`.

It requires:

- deletion reason;
- a text input that must exactly equal `DELETE`;
- a visible warning that deletion is permanent;
- disabled confirm button until both fields are valid;
- no display unless `canHardDelete` is true.

### 7.5 Read-only banner

Create `resources/js/components/research/research-read-only-banner.tsx` if a reusable component does not already exist.

Use it for Submitted and Posted student views. It should show the backend `readOnlyReason`, not hard-coded role logic.

### 7.6 Activity History

Update `resources/js/components/research/status-history.tsx` or rename it only if needed. Render the role-filtered Activity History supplied by the backend. Do not label it “Status History.” Include actor, action, changed fields/summary, timestamp, and approved notes/reasons.

## 8. Hooks, libraries, CSS, assets, and storage

### Hooks

Create only focused hooks:

```text
resources/js/hooks/use-research-save.ts
resources/js/hooks/use-research-capabilities.ts
resources/js/hooks/use-research-status.ts
```

- `use-research-save` owns FormData building, preview/confirm requests, processing state, modal state, and error handling.
- `use-research-capabilities` normalizes optional capability props; it must not grant defaults.
- `use-research-status` wraps shared label/badge/filter helpers.

Keep `use-unsaved-changes-warning.ts` and integrate it with the research form rather than creating duplicate unload warnings.

### Libraries and utilities

Add only small pure helpers under `resources/js/lib`:

```text
research-routes.ts
research-workflow-copy.ts
```

Do not put network state, authorization decisions, or React hooks in `lib`.

### CSS

Prefer existing Tailwind utility classes and the shared `Button`, `Dialog`, `Badge`, `Alert`, and `Tooltip` components. Add styles to `resources/css/app.css` only for genuinely shared classes not expressible through existing utilities.

### Public and storage

No workflow asset should be stored under `public/` or `storage/` from the frontend. File upload fields send selected files through the protected research endpoint. Never cache uploaded document files in local storage.

## 9. Accessibility and interaction requirements

- Every dialog has a title, description, keyboard focus handling, and visible loading state.
- Buttons state the result: “Save & Send Invitations,” not “Confirm.”
- Disabled controls include explanatory text or a tooltip; do not rely on color alone.
- Read-only forms use both disabled controls and a status banner.
- Preserve form entries after backend validation, modal cancellation, and version conflicts.
- Use responsive layouts; action rows must wrap on mobile.
- Do not show an email address to a user who is not authorized to see it.

## 10. Frontend tests

Use the repository’s existing test setup. If no frontend test runner exists, add the smallest compatible Vitest/React Testing Library setup rather than relying only on manual testing.

Minimum component and integration coverage:

- StatusBadge renders draft_invited and posted correctly.
- Workflow action panel renders only actions present in capabilities.
- Initial invite confirmation lists recipients and does not appear for restored Draft.
- Save-decision modal renders each summary group and correct buttons.
- Removal-only confirmation has no invitation-send button.
- Submitted student view is read-only and displays its reason.
- Returned student view enables permitted form fields and Submit for Review.
- Restored Draft hides initial Invite and opens the save-decision flow after backend response.
- Hard-delete dialog blocks confirmation until reason and `DELETE` are provided.
- Form preserves values and files between preview and confirmation requests.
- Version-conflict response preserves data and displays the conflict UI.

## 11. Frontend implementation order

1. Confirm the backend route names and Inertia/JSON response contract.
2. Add shared workflow types, status helpers, route helpers, and status badge support.
3. Update page props and capability-driven layouts.
4. Refactor ResearchForm field permissions, incomplete Draft validation, and Save Draft/Save Changes labels.
5. Implement `use-research-save` and wire the existing save-decision modal to backend summaries.
6. Add the initial invitation confirmation and restored-Draft behavior.
7. Refactor workflow action panel and workflow note/hard-delete dialogs.
8. Update My Research and status filters.
9. Add accessibility polish and automated tests.
10. Perform manual role-based testing with Faculty, linked Student, unlinked Student, Staff, and public visitor accounts.

## 12. VS Code Copilot prompts

Use the prompts in order. Do not ask Copilot to implement every frontend phase at once.

### 12.1 Master context prompt

```text
You are implementing the frontend for the research-entry workflow in this Laravel + Inertia React + TypeScript repository.

Read these files completely before editing:
- FINAL_RESEARCH_ENTRY_WORKFLOW.md
- RESEARCH_ENTRY_WORKFLOW_IMPLEMENTATION_GUIDE.md
- RESEARCH_ENTRY_WORKFLOW_FRONTEND_IMPLEMENTATION_GUIDE.md

Treat the final workflow as the product specification. The backend provides status, capabilities, workflow metadata, posting readiness, and save-decision summary data. The frontend must render those server-provided capabilities and must not grant access based only on role or hidden controls.

Important rules:
- Statuses: draft, draft_invited, submitted, returned, posted, archived.
- draft_invited is the status after initial Faculty invitations.
- A restored record remains draft; do not create draft_restored.
- Students edit only draft_invited and returned. Submitted and posted are view-only for linked students.
- Staff never sends student-completion invitations.
- The form uses backend-driven Save Only / Save & Send Invitations decisions.
- Keep the existing design system, Tailwind patterns, and Inertia architecture.

Before editing, inspect the existing files and list the exact files you will change. Implement only the phase I request. Preserve unrelated changes. After implementation, report changed files, behavior, and tests run.
```

### 12.2 Phase 1 — shared types, status UI, and routes

```text
Implement Frontend Phase 1 from RESEARCH_ENTRY_WORKFLOW_FRONTEND_IMPLEMENTATION_GUIDE.md.

Update only the shared TypeScript types, research status helpers/badge, status filters, and centralized research route helpers.

Requirements:
- Add typed ResearchStatus, ResearchCapabilities, ResearcherChangeSummary, and SaveDecisionRequired contracts.
- Replace published status assumptions with posted.
- Support draft_invited in labels, badges, and filters.
- Create a small research-routes helper only if named routes are not already available.
- Do not modify pages, forms, backend routes, or authorization logic yet.

Add or update focused frontend tests if the repository has a test setup. Report unresolved backend route-name mismatches instead of guessing.
```

### 12.3 Phase 2 — pages, props, and capability-driven read-only UI

```text
Implement Frontend Phase 2 from RESEARCH_ENTRY_WORKFLOW_FRONTEND_IMPLEMENTATION_GUIDE.md.

Update the research create, edit, and show pages plus only the supporting components required to pass typed status/workflow/capability props.

Requirements:
- Render actions from backend capabilities, not auth role checks.
- Add a reusable read-only banner using backend readOnlyReason.
- Show Submitted and Posted linked student entries as view-only.
- Keep Staff-created records student-collaboration-disabled in the UI.
- Do not implement save-decision networking or modal behavior yet.

Preserve existing page layout and accessibility. List all backend props required if they are not yet supplied.
```

### 12.4 Phase 3 — ResearchForm permissions and save flow

```text
Implement Frontend Phase 3 from RESEARCH_ENTRY_WORKFLOW_FRONTEND_IMPLEMENTATION_GUIDE.md.

Refactor resources/js/components/research/research-form/index.tsx and its direct form sections.

Requirements:
- Use typed backend capabilities for field and section editability.
- Save Draft is used in draft; Save Changes in draft_invited, submitted, and returned.
- Draft saving must allow incomplete metadata; do not require files or every researcher email merely to save.
- Preserve FormData, files, updated_at, and typed form state across a two-step backend save decision.
- Extract reusable save behavior into use-research-save.ts.
- Keep local storage safe: namespace by user/research, never persist files or access details.
- Do not create a new modal; wire the existing ResearchSaveDecisionModal later in the next phase.

Do not infer permissions from auth.user.role. Add tests for field-level read-only behavior and form-data persistence.
```

### 12.5 Phase 4 — invitation and removal modals

```text
Implement Frontend Phase 4 from RESEARCH_ENTRY_WORKFLOW_FRONTEND_IMPLEMENTATION_GUIDE.md.

Wire ResearchForm and use-research-save to the backend invitation_decision_required response contract. Update the existing ResearchSaveDecisionModal and create an initial invitation confirmation modal only if the generic modal cannot show recipient lists.

Requirements:
- Render grouped summary data for additions, changed emails, expired invitations, archive-revoked access, and removals.
- Removal-only flow has Cancel and Save Changes only.
- Other cases have Cancel, Save Only, and Save & Send Invitations.
- A restored Draft has no initial Invite button; its next save can open the decision modal.
- A Submitted invitation modal explains the new researcher is read-only until Returned.
- Keep the exact original FormData for the confirmed request.
- Handle cancellation, processing, server validation, and version conflicts without losing typed form entries.

Do not invent backend responses or send mail from the frontend.
```

### 12.6 Phase 5 — workflow action panel and destructive actions

```text
Implement Frontend Phase 5 from RESEARCH_ENTRY_WORKFLOW_FRONTEND_IMPLEMENTATION_GUIDE.md.

Refactor workflow-actions.tsx, workflow-note-modal.tsx, and direct supporting components.

Requirements:
- Render Submit, Return, Post, Archive, Restore, and Hard Delete only when backend capabilities allow them.
- Replace stale hard-coded route strings with confirmed route helpers.
- Add an initial Invite Researchers action only when canSendInitialInvitations is true.
- Do not duplicate the form-owned Save Only / Save & Send Invitations modal in the action panel.
- Add a hard-delete dialog that requires a reason and exact DELETE confirmation.
- Use proper action-specific labels, required note/reason fields, loading state, and accessible dialogs.

Add component tests for capability-driven actions and hard-delete validation.
```

### 12.7 Phase 6 — My Research, activity history, and testing

```text
Implement Frontend Phase 6 from RESEARCH_ENTRY_WORKFLOW_FRONTEND_IMPLEMENTATION_GUIDE.md.

Update Student My Research entry points/pages, Activity History presentation, status filters, and frontend tests.

Requirements:
- Student cards show Edit, Submit, or View only exclusively from backend capabilities.
- Do not show Archived research to students.
- Show Activity History rather than Status History, using backend-filtered entries.
- Ensure status filters include draft_invited and posted.
- Add focused tests for status badges, modals, read-only modes, restored Draft behavior, and destructive confirmation.
- Do not change unrelated dashboards, reports, or public Browse features.

Finish by listing manual role-based test scenarios that still need browser verification.
```

### 12.8 Prompt order

Copy prompts in this order:

1. Master context prompt (12.1)
2. Phase 1 — shared types/status/routes
3. Phase 2 — pages and capabilities
4. Phase 3 — form permissions/save flow
5. Phase 4 — invitation/removal modals
6. Phase 5 — workflow and destructive actions
7. Phase 6 — My Research/history/tests

Review each diff and run frontend checks before moving to the next phase. Do not begin frontend work until the backend route and response contracts are available.
