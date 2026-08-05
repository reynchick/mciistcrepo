# Final Research-Entry Workflow — Faculty, Student, and Staff

This workflow defines one research-entry form, one lifecycle, and clear access rules for Faculty, Students, and MCIIS Staff.

## 1. Core rules

### Research lifecycle

Every research record has one status: Draft, Draft (Invited), Submitted for Review, Returned for Revision, Posted, or Archived.

The permitted transitions are:

- `Draft → Draft (Invited)` when Faculty sends initial invitations.
- `Draft`, `Draft (Invited)`, or `Returned for Revision → Posted` when the entry is complete and the authorized role posts it.
- `Draft (Invited)` or `Returned for Revision → Submitted for Review` when a linked student submits.
- `Submitted for Review → Returned for Revision` when Faculty requests changes.
- An active record may be archived; `Archived → Draft` is a Staff-only restore.

**Draft (Invited)** means Faculty has completed the initial invitation round. It is configured as `draft_invited` in `config/research.php`; it does not require a new database column. It keeps normal Draft editing behavior but hides the initial **Invite Researchers** button.

A record restored from Archive remains **Draft**; it does not receive a separate “Draft (Restored)” status.

Staff may archive an entry from any active status. Archiving revokes all pending invitations and all linked researcher edit access. An Archived entry is read-only and must be restored to Draft before it can be changed or posted again.

### Required information

A research is ready to post when it has a title, program, abstract, completed date, adviser, at least one researcher, keywords, Agenda, SDG, SRIG, panelists, approval sheet, and manuscript. Researcher email addresses are required for invitations, not for posting. A Lead Author is optional; a research may have at most one.

For a genuine historical record, only Staff may mark **Manuscript**, **Approval sheet**, or **Panelists** as **Not Available (Legacy)**. That marker satisfies the relevant posting requirement. All other required fields must have real values. The public page must clearly show when panelist information is unavailable.

Seeded and demo data may bypass form validation.

### Researcher access and invitations

Faculty is the only role that sends student-completion invitations. Staff never sends them.

Faculty may manage the researcher list on a Faculty-created record while it is Draft, Draft (Invited), Submitted for Review, or Returned for Revision. The status controls whether linked students can edit; it does not prevent Faculty from correcting research information or authorship.

For a newly created **Draft** with no prior archive event, **Invite Researchers** is available when every listed researcher has a valid email. Sending initial invitations changes the status to **Draft (Invited)** and hides that button, preventing accidental duplicate invitations. A restored Draft uses the consolidated save modal instead of this initial-invite button.

An email address alone never grants access. A student receives access only after accepting an active invitation and completing any required account setup. Invitation records belong to a researcher through `researcher_invitations.researcher_id`; the researcher belongs to the research through `researchers.research_id`. No duplicate `research_id` or `invitations_sent` boolean is needed on the invitations table.

### Saving researcher changes after invitations

On a Draft (Invited), Submitted, Returned, or restored Draft entry, the backend checks researcher and invitation changes whenever Faculty clicks the current save action. If it finds a newly added researcher with an email, a changed email, an expired unaccepted invitation, or a researcher whose access was revoked by archiving, it shows one consolidated **Researcher access changes** modal before saving.

The modal lists only affected people and offers:

- **Save Only** — save the changes without sending email.
- **Save & Send Invitations** — save the changes and email only newly added addresses, corrected addresses, expired unaccepted invitations, and researchers who need a fresh invitation after archive.

Changing an email revokes the old email's pending invitation and edit access. Removing a researcher revokes that person's pending invitation and edit access. No email is sent to researchers with a still-valid pending invitation or current access.

If removing a researcher is the only access change, the system shows a short confirmation: *“This researcher will lose access to this research.”* It offers **Cancel** and **Save Changes**, with no invitation option. If the save also includes an added researcher, changed email, expired invitation, or archive-related re-invitation, the normal consolidated modal includes the same removal warning.

The same modal works while Submitted for Review. A newly invited student can accept the invitation and see the research in **My Research**, but the submitted entry is read-only until Faculty returns it for revision. The invitation email explains this status.

There is no separate resend button. If no affected researcher exists, the current save action completes normally.

### Restore after archive

Restoring an Archived record returns it to Draft but never revives old invitation links or student edit access. When Faculty next saves the restored Draft, the consolidated modal identifies researchers who need fresh invitations because archive revoked their access. **Save Only** keeps them listed without access; **Save & Send Invitations** sends fresh links and changes the record to Draft (Invited).

### Staff-created records

Staff-created records are **student-collaboration-disabled**: they never send student-completion invitations and students never receive edit access to them. The assigned Faculty adviser may edit a Staff-created record while it is Draft; Staff retains administrative edit access. Staff-created records do not enter the student submission cycle.

### Logs and history

**Research Entry Logs** are the Admin per-research-entry audit record. **Activity History** is the role-facing history for that same research, with information filtered for the viewer. Creation, edits, files, researcher changes, invitation/access changes, status changes, notification failures, archive/restore, legacy markers, adviser reassignment, and hard deletion are logged events. There is no separate “Status History” term.

## 2. Faculty workflow

### Create, invite, and complete a Draft

Faculty creates a research for a study they advise. Research ID, Uploaded By, Adviser, and the initial **Draft** status are set automatically.

Faculty may save a Draft at any time. **Save Draft** never sends email by itself. Faculty can either complete all metadata and post directly, or invite student researchers to help complete the entry.

For a newly created Faculty-created Draft, the action row is:

`[Save Draft]   [Invite Researchers]   [Post to Repository]`

Clicking **Invite Researchers** opens one confirmation listing the recipients. On confirmation, invitations are sent, the record becomes **Draft (Invited)**, and the initial invitation button is hidden. **Post to Repository** is enabled only when all posting requirements are satisfied.

For a restored Draft, the action row is `[Save Draft]   [Post to Repository]`; the next save uses the consolidated modal to issue any fresh invitations.

### Draft (Invited), review, and revision

Faculty may continue editing research content and researcher information in Draft (Invited), Submitted for Review, and Returned for Revision. The save button is **Save Changes** in these statuses. Researcher additions, email changes, and invitations are handled only through the consolidated save modal.

In Submitted for Review, students cannot edit. Faculty may correct the entry, manage the researcher list, and invite a researcher without changing the submitted status. An invited student sees the research as read-only until it is returned for revision.

Faculty may post a submitted entry when it is complete, or return it for revision with a note. Returning the entry reopens student editing; it does not change the researcher or invitation rules.

When posting, Faculty can choose whether to email researchers a view-only, congratulatory notice. Notification failure is logged but does not block posting. Posting revokes all pending edit-invitation links. Linked students can still find the posted entry in **My Research** as view-only.

Faculty may archive their own active, non-Posted research with a reason. Faculty never hard-deletes research and cannot edit or archive a Posted record.

## 3. Student workflow

An invited student signs in or completes account setup, then opens the linked research from the invitation or **My Research**.

For a Faculty-created entry, linked students may edit permitted research metadata while the status is Draft (Invited) or Returned for Revision. They cannot change the program, adviser, Research ID, uploader, researcher list, or Lead Author.

Students cannot edit while the entry is Submitted for Review, Posted, or Archived. A linked student can still view a Submitted entry in **My Research** with a clear review-status message. Posted entries remain visible there as view-only.

Students never receive edit access to Staff-created records.

## 4. Staff workflow

Staff is the research administrator. Staff can edit any active research entry, including one that is Submitted for Review; the edit does not change its status. The research page shows the latest update and Activity History so Faculty can see that a Staff change occurred during review.

For a Posted research, Staff may correct a minor typo directly. For a substantive published-record correction, Staff archives the record with a reason, restores it to Draft, makes the correction, and posts it again. This preserves a clear public-history trail.

Staff may correct researcher information for support, but never sends invitations or grants student access. A correction is logged and any obsolete invitation or access is revoked.

Staff may create historical or backfill records and post them directly once the posting requirements are met. On posting, Staff receives the same optional researcher-notification choice as Faculty; Staff notifications are view-only, never edit invitations.

Staff may mark eligible historical fields as **Not Available (Legacy)**, archive any active record, and restore an Archived record to Draft. Restore is blocked when an active record has the same title; Staff resolves the conflict before restoring.

Staff may hard-delete only an original Draft with no invitation or researcher-access history, or an Archived record after the institution's retention period. Hard deletion requires a reason and typing `DELETE`. Before the research is deleted, the system writes the existing `hard_delete_research_entry` event to **Research Entry Logs**, with the original research ID, title, prior status, reason, and relevant counts stored in `old_values` or `metadata`. The log remains in global Admin Logs after `target_research_id` is set to null by the existing `nullOnDelete()` foreign key. Hard deletion is not available to Faculty or directly from a Posted record.

Staff may reassign the adviser on an active record. The change is logged automatically; no written reason is required. The new adviser receives the record’s Faculty permissions and the former adviser loses them.

## 5. Backend save decision and concurrent editing

The backend, not the browser alone, calculates researcher and invitation changes against the current saved record.

1. Faculty submits **Save Draft** in Draft or **Save Changes** in another editable status, without an invitation decision.
2. The backend validates the submitted researchers and compares them with the saved list, invitation records, researcher access, and archive-revocation state.
3. If an affected researcher needs a decision, the backend returns the modal summary without saving.
4. Faculty selects **Save Only** or **Save & Send Invitations**. The form resubmits the same data with that decision.
5. The backend applies the change in one transaction, revokes obsolete invitations/access, logs the change, and sends email only after the transaction succeeds.

The existing automatic invitation behavior in researcher synchronization must be removed. Creating or changing a researcher email must wait for Faculty’s chosen modal action. Accepting an invitation must validate the token and signed-in email, set `accepted_at`, link `researchers.user_id` to the signed-in student, and log the event. Revoking accepted access clears that `user_id`; revoking only the invitation token is not enough.

Every save, file upload, and submission uses the record’s `updated_at` version stamp. If another person saved first, the system compares the originally loaded value, the submitted value, and the latest saved value:

- Non-overlapping changes merge automatically.
- A field changed by both people opens **Compare Changes** for the second saver.
- Only fields actually changed by a person are written to Research Entry Logs.

## 6. Permissions by status

This table applies to Faculty-created, student-collaborative records. Staff-created records remain student-collaboration-disabled.

| Action                                                      | Draft                                                        | Draft (Invited)  | Submitted for Review        | Returned for Revision | Posted          | Archived                           |
| ----------------------------------------------------------- | ------------------------------------------------------------ | ---------------- | --------------------------- | --------------------- | --------------- | ---------------------------------- |
| Faculty edits own Faculty-created entry and researcher list | Yes                                                          | Yes              | Yes                         | Yes                   | No              | No                                 |
| Faculty sends student invitations                           | Initial invite; restore modal when applicable                | Save modal       | Save modal                  | Save modal            | No              | No                                 |
| Linked student edits                                        | No                                                           | Yes              | No; view-only               | Yes                   | No; view-only   | No                                 |
| Linked student submits for review                           | No                                                           | Yes              | No                          | Yes                   | No              | No                                 |
| Staff edits                                                 | Yes                                                          | Yes              | Yes; status stays Submitted | Yes                   | Minor typo only | No                                 |
| Faculty posts                                               | Yes, if complete                                             | Yes, if complete | Yes                         | Yes, if complete      | No              | No                                 |
| Staff posts                                                 | Yes, if complete                                             | Yes, if complete | No                          | Yes, if complete      | No              | No                                 |
| Faculty archives                                            | Yes                                                          | Yes              | Yes                         | Yes                   | No              | No                                 |
| Staff archives                                              | Yes                                                          | Yes              | Yes                         | Yes                   | Yes             | No                                 |
| Staff restores                                              | No                                                           | No               | No                          | No                    | No              | To Draft only                      |
| Hard delete                                                 | Staff only: original Draft without invitation/access history | No               | No                          | No                    | No              | Staff only: after retention period |
| Linked student sees entry in My Research                    | No                                                           | Yes              | Yes, view-only              | Yes                   | Yes, view-only  | No                                 |
| Publicly visible                                            | No                                                           | No               | No                          | No                    | Yes             | No                                 |

## 7. Short exception rules

- A research must always have at least one researcher before posting.
- A pending invitation becomes invalid when its researcher email changes, the researcher is removed, the record is posted, or the record is archived.
- A student who follows an invalid invitation sees an explicit invalid-invitation message and receives no access.
- Duplicate titles do not block normal creation. They only block restore when the same active title already exists.
