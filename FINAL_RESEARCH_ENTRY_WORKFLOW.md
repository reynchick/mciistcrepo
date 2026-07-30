# Final Research-Entry Workflow — Faculty, Student, and Staff

This builds directly on `UPDATED_RESEARCH_STATUS_AND_WORKFLOW_PLAN.md`. It translates that data model into a role-by-role walkthrough, and resolves the "what if" cases that the status table alone doesn't answer.

---

## 0. Foundations everyone shares

- **One form, no `entry_mode` field.** The system infers what's possible from which fields are filled, not from a chosen path.
- **Two live checklists**, computed automatically, drive which buttons are enabled:
  - *Ready to invite* — title, program, adviser (auto), ≥1 researcher, valid email per researcher, and a designated Lead Author if there is more than one researcher (see §1.3).
  - *Ready to post* — title, abstract, ≥1 researcher, adviser, keywords, approval sheet, manuscript, date completed, Agenda, SDG, SRIG, panelists if applicable. Zero researchers is never allowed — see §4.7.
- **Buttons are always visible, never hidden.** Invite Researchers and Post to Repository sit in the same place on the form from the start, greyed out until their checklist is satisfied. Hovering (or tapping, on touch devices) a disabled button shows exactly what's missing, e.g. *"Add at least one researcher's email to enable this."* Nothing appears or disappears as the form fills in — only the greyed-out state changes.
- **A short instructions summary sits above the form**, collapsed by default (an accordion, not a separate page), one line: *"Provide title, program, at least one researcher, and their email to invite researchers to complete this entry. Provide all research metadata to post directly to the repository."* Faculty who want more detail can expand it; most won't need to, since the disabled-button tooltips repeat the same information exactly when it's relevant.
- **Seeded/demo data is exempt.** The *Ready to post* checklist is a form/API validation rule, not a database constraint — development seeders can insert records directly as Posted with incomplete metadata for testing, bypassing the form and checklist entirely. This isn't a contradiction; in production the only way a real Posted record skips fields is Staff's "Mark as Not Available (Legacy)" mechanism (§3.3), which is logged. Seeders don't need that ceremony.
- **Every save/submit carries a version stamp** (`updated_at`); mismatches are resolved automatically, with a person only asked to choose when truly necessary. Full mechanism in §5 — it's role-agnostic, so it's written up once instead of repeated in every what-if that touches it.

---

## 1. Faculty workflow

### 1.1 Create the entry

Faculty starts a record for a study they advise. Research ID, Uploaded By, and Adviser are set automatically. Status = **Draft**.

Faculty fills in whatever they currently have — sometimes just title, program, and researcher names/emails; sometimes the full metadata set.

**Save Draft** is always available and never sends email. This is the only action available until the *Ready to invite* checklist is satisfied.

### 1.2 Choose what happens next

All three actions sit in the same row from the moment the form opens:

`[Save Draft]   [Invite Researchers to Complete Entry]   [Post to Repository]`

- **Save Draft** is always enabled.
- **Invite Researchers to Complete Entry** is greyed out until *Ready to invite* is satisfied. Hover explains what's missing.
- **Post to Repository** is greyed out until *Ready to post* is satisfied. Hover explains what's missing.

These are not exclusive paths — a Faculty member with complete information can ignore Invite entirely and go straight to Post to Repository once it's enabled. A Faculty member who invites students can still edit the entry and post it later once students finish.

**Clicking Invite Researchers** opens a confirmation modal that only *displays* the recipients — it does not accept edits:

> Invite 2 researchers to complete this entry?
> • juan.delacruz@usep.edu.ph
> • maria.santos@usep.edu.ph
>
> [Cancel]&nbsp;&nbsp;&nbsp;[Go back and edit]&nbsp;&nbsp;&nbsp;[Send Invitations]

If an email is wrong, Faculty clicks **Go back and edit**, which closes the modal and returns them to the researcher list on the form — the only place researcher data is actually edited. The modal's only job is to confirm who's about to receive an email; keeping edit and confirm on two separate screens removes any ambiguity about where a correction belongs. On confirm: status stays Draft, invitations send, and the entry gains the invitation-status table described in §1.4.

**Clicking Post to Repository** opens a confirmation with an explicit notification choice, since not every study has reachable researchers by the time it's posted:

> Post this research to the MCIIS Repository?
> It will become visible to Browse users and can no longer be edited by student researchers.
>
> ☑ Notify researchers by email (view-only, congratulatory)
>
> [Cancel]&nbsp;&nbsp;&nbsp;[Post to Repository]

The checkbox defaults on but Faculty can uncheck it — for research completed by students who graduated one or several years ago, or whose emails are no longer active, Faculty simply unchecks it and posts without sending anything. If it's left checked and an email happens to bounce, that's logged quietly in Status History ("notification undeliverable") and never blocks or reverses the posting — a courtesy email failing is not a posting failure.

### 1.3 Designate a Lead Author (before inviting)

When there's more than one researcher, Faculty designates one as **Lead Author** in the same researcher list — no separate step. A short banner sits right above that list so the reason is visible in context:

> *Tip: If this research has more than one researcher, choose a Lead Author. They'll be the one who submits the completed entry for adviser review.*

With more than one researcher, a Lead Author is **required** before Invite Researchers turns on — this closes off the no-Lead-Author case for the large majority of records up front, rather than handling it as a special case later. With exactly one researcher, that person is automatically the Lead Author; there's nothing to designate.

**All linked researchers can edit the entry regardless of who is Lead Author** — the designation only ever affects who can *submit*, never who can *contribute*. If Faculty picks the "wrong" person, that's a one-field correction they can make themselves any time the entry is Draft or Returned for Revision, the same as fixing any other field — no special workflow needed, since Faculty and the students already have other ways to sort out who intended what.

**If a Lead Author is genuinely never set** (legacy data, or an edge case where researchers were linked after creation) — any linked researcher may submit for review, not Faculty. Having Faculty submit their own advisee's work for their own review was the awkward option; letting an already-trusted, already-editing researcher submit instead avoids that without inventing a new role. Submit always shows a one-line confirmation regardless of who clicks it — *"Submit this research for review? No one will be able to edit it until your adviser responds."* — which is enough friction on its own to prevent an accidental early submission.

### 1.4 Review a student submission

When a student submits for review, Faculty gets an email and sees status **Submitted for Review**. Faculty can:

- **Post to Repository** — if it's genuinely ready.
- **Return for Revision** — requires a note; all linked researchers get the note by email.

There is no "send back to Draft" action — Returned for Revision *is* the editable state that follows a rejected review.

### 1.5 Tracking who has access (no separate page, no new status field)

No dedicated "invitation status" concept. It turns out to be unnecessary once you separate two things that look related but aren't: whether someone can log in, and whether they've contributed anything. The second is already visible in edit history — nobody should have to read a badge as a participation scorecard.

For the first, there's nothing to invent. It's a derived fact, not a new stored state:

- **Has access** = the researcher row is linked to a real, logged-in account (`researchers.user_id IS NOT NULL`, and their profile is complete).
- **Doesn't yet** = it isn't. No further breakdown between "hasn't clicked" and "clicked but hasn't finished setup" — Faculty can't act differently on those two anyway, so there's no reason to make them tell the two apart.

This shows up inline in the researcher list already on the entry — no new column, no separate table on screen. A researcher who hasn't logged in yet gets a small greyed "not yet signed in" note next to their name; once they have, the note disappears. If everyone already has access, the list just looks like a plain list of names, which is the common case.

**Resend reuses the same Invite Researchers button** rather than adding a per-row action — clicking it again is idempotent: it silently skips anyone who already has access and only (re)sends to whoever doesn't yet. One button does double duty; there's nothing new to learn.

The one addition worth having, and it's optional for v1: a **stale draft flag**. If a Draft has had no activity (no edit, no login by a linked researcher) for a long stretch — say 60–90 days — show a small badge on Faculty's My Research list, e.g. *"No activity in 74 days."* This surfaces abandoned entries in a list Faculty already checks, rather than building a separate monitoring system.

The Student-side **My Research** tab mirrors this from their end — each linked entry shows its own status (needs their input / submitted / posted), so nobody's dependent on the other side remembering to check in.

If Faculty edits a researcher's email after the invite was sent, the system revokes the un-accepted invitation record for that researcher and issues a new one to the corrected address (see cross-role scenarios, §4.3, for what happens to anyone who already clicked the old link).

**Data model note:** this needs one addition to `researchers` — a nullable `user_id` foreign key to `users`, set the moment an invitation is accepted. That single link is what turns "has access" from a feature to build into a query to run. The existing `researcher_invitations` table (token, email snapshot, revoked/accepted timestamps) already covers everything the invite-and-resend flow needs — no extra `invited_at` column required, since `researcher_invitations.created_at` already is that, scoped correctly per research.

### 1.6 Archive

Faculty can archive their own non-Posted research (with a required reason). Faculty cannot archive Posted research — only Staff can, since that's a public-facing action with broader implications.

### Faculty what-if table

| Scenario                                                                                                           | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Faculty wants to post but hasn't invited anyone and has all the data themselves                                    | Fully supported — skip Invite entirely, go straight to Post to Repository once*Ready to post* is satisfied.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Faculty clicks Invite Researchers, then later gets the remaining files/abstract themselves before students respond | Faculty can still fill in the fields directly and click Post to Repository once complete — the invitation isn't a lock, it's just an information request that becomes moot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Faculty adds a researcher after invitations were already sent to others, on a Draft record | The new researcher shows the same "not yet signed in" note as anyone without access (§1.5) — no separate badge needed. Clicking **Invite Researchers** again is idempotent: it silently skips anyone who already has access and sends only to the new person, so existing invitees never get a duplicate email. |
| Faculty wants to add or remove a researcher on a record that's already**Posted**                             | Not a self-service Faculty edit — Posted records are locked for Faculty per the role table. This goes through the correction flow (§4.6: archive with reason → edit → re-post), or is handled directly by Staff, so the public record is never changed in place.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Faculty removes a researcher who has already been editing                                                          | Detected by comparing the researcher list at save time against the last-saved version. If someone was removed, Save is intercepted by a short required prompt before it completes:*"Remove [Name] from this research?"* with a reason — a quick dropdown (Duplicate entry / No longer part of the study / Added by mistake / Other) plus an optional note for "Other." Access is revoked immediately on save. Their user ID stays permanently in Status History and any per-field edit log — removal changes their *access*, never the historical record of what they contributed.                                                                                                                                                                                                                    |
| Faculty wants to un-invite someone (typo'd the wrong student, invitation still Pending)                            | This is Faculty correcting their own mistake before the student has meaningfully engaged, so it stays frictionless — no reason required. A**Cancel Invitation** action appears on any row still **Pending**; clicking it shows a one-line confirm ("Cancel this invitation? They won't be able to access this research.") with no reason field, since nothing was contributed yet. If the student never opened the link, no email goes out at all. If they opened it but hadn't completed their profile, they simply see the standard invalid-invitation page if they try to continue. The moment someone has actually saved content, treat any further removal as the "remove a researcher" row above, which does require a reason — the dividing line is whether they contributed anything. |
| Faculty tries to post while a required field shows complete but is actually low-quality (e.g., one-word abstract)  | Out of scope for automated gating — the checklist checks*presence*, not quality. Consider a non-blocking warning ("Abstract is unusually short") rather than a hard block, since Faculty is the accountable party.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Faculty is removed as adviser (e.g., leaves the institution) mid-Draft                                             | See §4.5 — reassignment is a Staff action, not something Faculty can do to themselves.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Faculty wants to post something with zero researchers listed                                                       | Not permitted. ≥1 researcher is a hard requirement in*Ready to post*, with no adviser-only exception — this keeps the rule simple and matches how research is actually attributed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Faculty tries to edit a Posted record                                                                              | Not permitted per the role table. If a correction is genuinely needed post-posting, that goes through Staff or the archive-edit-repost flow (§4.6), not a reopened edit on the live public record.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## 2. Student workflow

### 2.1 Receiving the invitation

A student researcher gets one of three emails depending on account state:

| Account state                        | Email contains                                                  |
| ------------------------------------ | --------------------------------------------------------------- |
| Existing account, complete profile   | Direct sign-in link to the research entry                       |
| Existing account, incomplete profile | Profile-completion link, then redirect into the entry           |
| No account                           | Google sign-in/account setup link, then redirect into the entry |

### 2.2 Completing the entry

Once inside, the student sees the same form Faculty was using, scoped to Draft or Returned for Revision status only. They can add abstract, keywords, files, and other metadata, but cannot touch Research ID, Uploaded By, or Adviser.

If a Lead Author has been designated (required whenever there's more than one researcher — see §1.3), only that student sees the **Submit for Review** action; co-authors can still edit everything, just not submit. If no Lead Author is set at all (a legacy or edge-case record), any linked researcher may submit instead — this avoids the awkward situation of Faculty submitting their own advisee's work for their own review, while still keeping submission gated behind someone who's actually part of the study.

### 2.3 Submitting for review

Submit for Review carries the record's version stamp along with it. If someone else saved a conflicting change first, the student is shown Compare Changes before they can proceed — see §5 for the full mechanism, including why this never misattributes changes in the audit log.

On successful submit: status → **Submitted for Review**, edit access is frozen for all students, and Faculty is emailed.

### 2.4 Returned for Revision

If Faculty returns the entry, linked researchers get the note by email and edit access reopens. The cycle (edit → submit → review) repeats until Faculty posts it.

### Student what-if table

| Scenario                                                                                                                                                                     | Resolution                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student never opens the invitation                                                                                                                                           | Entry stays Draft indefinitely. It shows as "Pending" in the invitation-status table (§1.5) so Faculty can nudge or resend. No auto-expiry unless you want one (§4.2 covers what happens if the record is archived while still pending).                     |
| Any two people editing different fields at the same time — two co-authors, a co-author and the Lead Author, a co-author and the adviser, or the Lead Author and the adviser | Both saves succeed — non-overlapping fields never conflict, regardless of who the two people are.                                                                                                                                                             |
| Any two people editing the *same* field at the same time (same combinations as above) | Whoever saves first wins that save; the second gets Compare Changes and must explicitly choose which version to keep. This rule is identical for every role pairing — see §5 for the full mechanism and why that's deliberate. |
| No Lead Author is designated at all (rare, since it's required once there's more than one researcher)                                                                        | Any linked researcher can click Submit for Review instead — see §1.3. There's no dead end where nobody is able to submit.                                                                                                                                    |
| A student is removed from the record after already contributing content                                                                                                      | Access is revoked, contributed content remains attached to the record (§1.6, Faculty table). The student sees a "you no longer have access" message rather than a broken page if they try to return.                                                          |
| A student clicks an old invitation link after Faculty corrected their email                                                                                                  | They see an explicit invalid-invitation page (per the source doc) and are not granted access. They are not silently redirected — otherwise a wrong recipient could gain access to the wrong record.                                                           |
| A student tries to edit while the record is Submitted for Review                                                                                                             | Blocked per the role table. Show a clear "This entry is under adviser review and can't be edited right now" message rather than a generic permission error.                                                                                                    |
| A student wants to withdraw from a research entry themselves                                                                                                                 | Not a self-service action in this model — only Faculty/Staff remove researchers. If self-withdrawal is a real need, add it as a request that notifies Faculty rather than an instant removal, so authorship isn't silently altered without adviser awareness. |

---

## 3. Staff workflow

Staff never invites students and never lets students submit or edit Staff-created records — this path is entirely staff/faculty-mediated.

### 3.1 Complete Staff record

Staff creates or edits a record with everything already verified (common for historical/backfill entries). Status starts Draft.

Clicking **Post to Repository** moves it straight to **Posted**. If researcher emails happen to be on file, they get a view-only congratulations email — never an edit invitation, since students never get access to Staff-created records.

### 3.2 Staff needs Faculty input

If Staff has an incomplete record (say, a historical entry missing SDG/SRIG classification that only the adviser can supply), Staff clicks **Request Faculty Information**, enters a required note, and the system:

- Sets status to **Returned for Revision**
- Logs the action as `request_adviser_metadata` in Status History
- Emails only the assigned Faculty adviser
- Faculty sees the status displayed as *"Awaiting adviser input requested by MCIIS Staff"* rather than the generic Returned-for-Revision label, so it's clear this didn't come from a review cycle

Once Faculty supplies the information and saves, Staff (or Faculty, if permitted) moves it to Posted. Staff-created records never pass through Submitted for Review — that status is reserved for the student-completion cycle.

### 3.3 Historical records with genuine, permanent gaps

Some old research legitimately has no keywords, no SDG/SRIG alignment, or missing files, and no living adviser to ask. Recommendation not fully specified in the source document — resolve as follows:

- Add a Staff-only **"Mark field as Not Available (Legacy)"** action per field, distinct from simply leaving it blank.
- A field marked this way counts as "satisfied" for the *Ready to post* checklist, but the public detail page shows a small note (e.g., "Metadata not available for this historical record") instead of pretending the data exists.
- This keeps the mandatory-field logic intact for current research (where "blank" really does mean "missing") while giving Staff a legitimate, audited way to publish older work. It is not a new `entry_mode` — it's a per-field annotation that only Staff can set, and it's visible in Status History.

### 3.4 Archive, restore, hard delete

- Staff can archive any status, including Posted (Faculty cannot archive Posted).
- Only Staff can restore. Restore is blocked if an active record already has the same title — surface the conflicting record so Staff can decide (rename, merge, or cancel restore) rather than failing silently.
- Hard delete: Staff only, Draft only, requires a reason, logged before removal. Never available for Posted/Archived research.

### 3.5 Guest file requests

Staff doesn't approve these directly (Lead Author and/or Faculty adviser do), but Staff should have read visibility into pending requests for support purposes, per the "view/support only" role.

### Staff what-if table

| Scenario                                                                                                  | Resolution                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staff uploads a record, then later realizes it needs the adviser's input after already posting it         | Posted records can't be reopened via Request Faculty Information (that flow is Draft/Returned-only). Staff archives the Posted record with a reason, corrects it, and re-posts — Status History preserves the full trail rather than editing a live public record in place.                                                      |
| Staff assigns a Faculty adviser who no longer works there / has no account                                | Block record creation (or at minimum, the Post/Invite actions) until a valid, active Faculty account is selected as adviser — an orphaned adviser reference breaks the whole review chain.                                                                                                                                       |
| Staff tries to restore an Archived record, but the title now matches a newer, unrelated record            | Restoration is blocked with the conflicting record shown; Staff resolves manually (e.g., appending "(legacy)" to the restored title) before retrying.                                                                                                                                                                             |
| Staff needs to fix a typo in a Posted record's title                                                      | Treat as a normal edit permission for Staff on Staff-created Posted records (per the role table, Staff support/edit rights differ from Faculty's). For Faculty-created Posted records, route through Faculty since it's their advised research — Staff facilitates but doesn't unilaterally change Faculty-owned public content. |
| A historical batch-import has hundreds of records missing the same fields                                 | Use the same "Mark as Not Available (Legacy)" mechanism in bulk during import rather than one-by-one — same audit trail, just applied at import time.                                                                                                                                                                            |
| Staff wants to post a record but a Guest file request is pending approval by the (now former) Lead Author | File requests reference specific people, not the record's live edit permissions — posting proceeds independently. If the approver is no longer valid, that's a separate cleanup (reassign approver) handled through the Guest-request queue, not blocking Post to Repository.                                                    |

---

## 4. Cross-role what-if scenarios

These span more than one role and are easy to miss if each workflow is designed in isolation.

**4.1 — Simultaneous edits, any pairing.** Fully covered by the mechanism in §5 — it checks only whether the version being saved against is still current, never *who* the two editors are, so it automatically covers every combination without any role-specific logic: two co-authors, a co-author and the Lead Author, a co-author and the adviser, or the Lead Author and the adviser.

**4.2 — Invitation sent, then the record is archived before any student responds.** Archiving should auto-invalidate pending invitation links (same invalid-invitation page as a revoked one). Otherwise a student could "complete" and try to submit a record that no longer functionally exists.

**4.3 — Faculty corrects a researcher's email after the student already opened (but hasn't saved to) the old link.** The old link is revoked the moment the email is corrected, regardless of whether the student is mid-session. If the student tries to save, they get the invalid-invitation page, not a save error — the messaging should make clear *why* (wrong/updated invitation), not just that something failed.

**4.4 — A record has no Lead Author, and Faculty is unreachable/on leave.** Since any linked researcher can submit when no Lead Author is set (§1.3), this is no longer a dead end — the students aren't blocked on Faculty's availability just to move the record into review.

**4.5 — Reassigning the adviser mid-record.** Not covered in the source document; recommend a Staff-only "Reassign Adviser" action, required-reason, logged in Status History, available for any non-Posted status. The new adviser inherits full Faculty permissions on the record going forward; the old adviser loses edit/submit/post rights on it immediately.

**4.6 — A Posted record needs a substantive correction (not just a typo), e.g., wrong SDG alignment discovered after publication.** Recommend: Staff or the owning Faculty archives with a reason, edits while Archived, then re-posts. This avoids ever silently mutating a record the public has already seen and possibly cited, while keeping a clean history of the correction.

**4.7 — Zero researchers ever get added to a record.** Not allowed, decided as a hard rule rather than a configurable policy — *Ready to post* blocks on "≥1 researcher" the same way it blocks on a missing title, with no adviser-only exception.

**4.8 — Same title used twice legitimately** (e.g., a re-study or a corrected re-submission of prior work). The duplicate-title check should only block **Restore**, per the source document — it should not block ordinary creation, since legitimate duplicate titles happen. If you want a softer guardrail at creation time too, use a non-blocking "A similar title already exists — is this the same study?" warning instead of a hard stop.

---

## 5. Concurrent editing mechanism

This underpins every "two people edit the same thing" what-if scattered through the sections above (§2.3, §4.1) — written up once here instead of repeated per scenario, since the rule is identical regardless of who's involved.

**The model: optimistic concurrency at the record level, using data the schema already has.** No locking, no "this entry is being edited by someone else, try again later." `researches.updated_at` (already present via `timestamps()`) is the version stamp. The edit page loads it alongside the data; every Save, file upload, and Submit for Review resubmits it; the backend writes conditionally:

```
UPDATE researches SET ... WHERE id = ? AND updated_at = ?
```

Zero rows affected means someone else saved in between — reject that write, don't touch the row. Since researcher-list edits live on a separate `researchers` table but are always submitted together with the rest of the form, any write to `researchers` for a given research also touches the parent `researches` row — so one version stamp gates the whole entry (abstract, files, and researcher list alike) instead of needing separate versioning per table.

**Resolving a conflict: a three-way diff against the live database, never against the stale copy the browser loaded.** On save, the backend compares three things per field: what was loaded, what this user is submitting, and what's actually in the database right now.

- Unchanged by the other person → the user's edit applies, silently.
- Changed by the other person, untouched by this user → the database's latest value is kept, silently.
- Changed by both → this is the only case shown to the user, on a **Compare Changes** screen, scoped to just that field.

**Who resolves it:** whoever's write fails the version check (arrives second) sees Compare Changes. The person whose save already succeeded is never interrupted — there's nothing left to ask them, and if they touch the same field again later without having refreshed, the roles simply reverse based on save order at that moment. Nobody is permanently "the person who chooses."

**Deliberately reactive, not proactive.** No live banner, no polling, no websocket telling someone the record changed while their tab sits open. The save-time check alone already fully prevents data loss — nothing is ever lost either way, silent merge or Compare Changes. A standing live-update notice would only reduce mild, self-resolving cosmetic confusion, at the cost of real infrastructure for a genuinely rare event (two people, same field, same moment). After a person's own save succeeds, their local version stamp just updates quietly from the server response — no reload — so they stay in sync with their own actions automatically; the check only ever needs to catch what happened *between* two of their own saves.

**Audit log integrity.** `research_entry_logs` is written from the same three-way diff, never from a raw dump of the submitted payload. A field that was silently carried forward unchanged (because it matched the current database value) never generates a log entry — only fields the user actually changed do. This is what keeps `modified_by` from ever misattributing someone else's edit: a no-op field simply never reaches the logger.

**Telling the user what happened, without a live banner.** The one place a silent merge does need to surface is the save confirmation itself, since a field they never touched just changed in front of them:

> Saved. Note: **Abstract** was also updated by Maria Santos just now — your save includes her latest version.

This reuses the same diff already computed for logging and conflict detection, so it costs nothing extra, and it only appears when relevant — the same "explain it at the moment it matters" principle used everywhere else in this document (disabled-button tooltips, invalid-invitation pages).

**Why this is the right stopping point.** Real-time collaborative editing, field-level locks, and live change notifications all solve for a scenario that's rare given how small a research team is and how much Faculty and students already coordinate outside the app. A version-stamp check plus a three-way diff is the standard, well-understood pattern here — cheap to implement, fully safe against data loss, and it needs no role-specific handling anywhere, which keeps it consistent with every other mechanism in this document.

---

## 6. Quick-reference: who can do what, when

| Action                      | Draft                                                            | Submitted for Review     | Returned for Revision      | Posted          | Archived |
| --------------------------- | ---------------------------------------------------------------- | ------------------------ | -------------------------- | --------------- | -------- |
| Faculty edits (own advised) | Yes                                                              | No                       | Yes                        | No              | No       |
| Student edits (linked)      | Yes                                                              | No                       | Yes                        | No              | No       |
| Student submits for review  | Yes (Lead Author if designated, otherwise any linked researcher) | —                       | Yes                        | —              | —       |
| Faculty invites researchers | Yes                                                              | —                       | —                         | —              | —       |
| Faculty/Staff posts         | Yes, if checklist complete                                       | Yes (Faculty, on review) | Yes, if checklist complete | —              | —       |
| Faculty archives            | Yes                                                              | Yes                      | Yes                        | No (Staff only) | —       |
| Staff archives              | Yes                                                              | Yes                      | Yes                        | Yes             | —       |
| Staff restores              | —                                                               | —                       | —                         | —              | Yes      |
| Hard delete (Staff only)    | Yes                                                              | No                       | No                         | No              | No       |
| Publicly visible            | No                                                               | No                       | No                         | Yes             | No       |

This table is the same status machine as the source document — it's included here so Faculty/Student/Staff behavior can be checked against one table instead of cross-referencing three separate workflow write-ups.
