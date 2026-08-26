# MCIIS Manuscript & Approval Sheet Access Request Workflow

## Complete Implementation Guide (Combined)

**Last Updated:** 2026-08-25
**Status:** Ready for final decision & implementation

---

## Part 1: Executive Summary

The Browse page has a **partial implementation** of guest file access via `GuestFileRequest` model. This document provides:

1. **Current state analysis** (what exists, what's missing)
2. **Three approval workflow options** evaluated for handling graduated lead authors with inactive emails
3. **Recommended solution** with complete technical specs
4. **Final decision checklist** for stakeholders

---

## Part 2: Current State

### What Exists ✅

- Frontend buttons for "Request Access" (unauthenticated) and direct download (authenticated)
- `GuestFileRequest` model tracking lead author + adviser approvals
- Public routes: `POST /guest/research/{research}/request`
- Download controller checks for approved requests
- Basic authorization structure in place

### Critical Gaps ❌

| Gap                          | Impact                                           | Severity           |
| ---------------------------- | ------------------------------------------------ | ------------------ |
| No email notifications       | Approvers never know about requests              | **HIGH**     |
| No approval tokens/links     | Approvers can't approve via email                | **HIGH**     |
| No SSO enforcement           | Guests bypass Google SSO                         | **MEDIUM**   |
| No escalation mechanism      | Old theses stuck forever if lead author inactive | **CRITICAL** |
| No request status visibility | Guests have no feedback                          | **MEDIUM**   |

## Part 2A: Step-by-Step Implementation Runbook

Implement the workflow in this order. Complete and test each step before moving to the next one.

### Step 1: Confirm the access rules

Use these rules as the single backend contract:

- A requester must be authenticated through Google SSO with a valid `@usep.edu.ph` email before submitting a request.
- The Adviser is the final approver.
- The Lead Author may provide consent when an active account exists, but Lead Author consent alone never grants access.
- If the Lead Author is unavailable, the Adviser may approve directly.
- If the Adviser does not act, MCIIS Staff may approve only after escalation.
- A linked Student researcher, the Adviser for advised research, MCIIS Staff, and an Administrator can download directly through the normal download routes. They do not submit access requests for their own authorized research.
- Rejection closes the current request permanently; the same authenticated requester may submit a new request later.

### Step 2: Add the database fields

Update the existing `guest_file_requests` migration while the project is still in development, or create a new migration if this table has already been shared with other environments.

Add at minimum:

- `status`: `pending`, `pending_adviser_approval`, `escalated`, `approved`, `rejected`, or `expired`.
- `approval_policy`: `adviser_final`.
- `approval_token_hash` and optional token metadata. Store a hash, not the raw email token.
- `expires_at` and `escalated_at`.
- `lead_approved_at`, `lead_approved_by`, `adviser_approved_at`, and `adviser_approved_by`.
- Email delivery state for the Adviser and Lead Author, including hard-bounce status.
- `rejection_reason`.

Add an audit table for approval events and escalation events. A separate email-delivery log is useful if the configured mail provider exposes bounce events.

Do not use the raw request ID as an approval credential. Do not grant access by looking up any approved request for a research record; the approved request must belong to the authenticated requester or use a secure, requester-bound download grant.

### Step 3: Update the `GuestFileRequest` model

In `app/Models/GuestFileRequest.php`:

1. Add the new fields to casts and guarded/fillable configuration.
2. Add relationships for the research, requester, approving users, audit events, and email logs.
3. Add methods such as `isPending()`, `isExpired()`, `isEscalated()`, and `hasAdviserApproval()`.
4. Keep approval transitions in one service or model method so controllers cannot accidentally grant access after Lead Author consent.
5. Make approval idempotent: a second click must return the current state and must not overwrite the original approver or timestamp.

### Step 4: Enforce SSO before request creation

Change `GuestFileRequestController@request` and the Browse modal together:

1. The Browse button redirects a guest to the Google SSO login route and stores the intended research/file action in the session.
2. The SSO callback validates the email domain exactly as required by the existing authentication design.
3. After login, return the user to the Browse details view and ask for an explicit request submission if necessary.
4. The backend request endpoint must use `auth` middleware and reject unauthenticated requests with HTTP `401` or redirect behavior appropriate for the client.
5. Validate that the research is posted, the requested file exists, and the authenticated requester is not already an authorized stakeholder.
6. Prevent duplicate active requests for the same requester, research, and file type. Return the existing request status instead.

### Step 5: Create the approval recipients

When a request is created:

1. Resolve the Faculty Adviser’s current linked user account and usable email.
2. Resolve the Lead Author only if the researcher is marked `is_lead_author` and has a usable active linked account/email.
3. Always send the Adviser an approval email when the Adviser exists.
4. Send the Lead Author a consent email only when the Lead Author is eligible. If not, record the reason and continue with Adviser approval.
5. If no Adviser exists, escalate the request immediately to MCIIS Staff because there is no final academic approver.

Send mail after the database transaction commits. Queue the messages so a mail-server delay does not roll back the request. Record delivery attempts and process confirmed hard bounces from the mail provider when available.

### Step 6: Use secure, role-specific approval links

Create separate random, single-purpose tokens for the Adviser and Lead Author. The token should identify the request and intended role only after server-side verification.

Recommended flow:

1. Generate a cryptographically random raw token.
2. Store only its hash with `recipient_role`, `guest_file_request_id`, `expires_at`, and `used_at`.
3. Email a `GET` link that opens a confirmation page. Do not mutate approval state on `GET`, because email scanners can visit links automatically.
4. Require the approver to authenticate with the account associated with the role before showing the action.
5. Submit approval or rejection through a CSRF-protected `POST` route.
6. Re-check token hash, role, account identity, request status, and expiry inside a database transaction.
7. Mark the token used after the action, while keeping the audit record permanently.

### Step 7: Implement approval transitions transactionally

Use a row lock such as `lockForUpdate()` when processing an approval:

- **Lead Author approves:** record consent; status becomes `pending_adviser_approval`; send the Adviser an immediate update email.
- **Adviser approves:** status becomes `approved`; create the requester’s file-access grant; notify the requester.
- **Adviser rejects:** status becomes `rejected`; store the reason; notify the requester.
- **MCIIS Staff approves after escalation:** status becomes `approved`; record Staff as the approving actor; notify the requester.
- **MCIIS Staff rejects after escalation:** status becomes `rejected`; store the reason; notify the requester.
- **No action by day 14:** status becomes `expired`; do not create an access grant.

If Lead Author consent already exists, the Adviser queue must show `Lead Author consent received — Adviser approval required`. If the Adviser has already decided, later links must show the final result instead of offering another action.

### Step 8: Add the backend routes

Replace the current ID-based approval design with routes that separate viewing from mutation:

```php
Route::middleware('auth')->group(function () {
  Route::get('/file-access-requests/{request}/review', [FileAccessRequestController::class, 'review'])
    ->name('file-access-requests.review');

  Route::post('/file-access-requests/{request}/approve', [FileAccessRequestController::class, 'approve'])
    ->name('file-access-requests.approve');

  Route::post('/file-access-requests/{request}/reject', [FileAccessRequestController::class, 'reject'])
    ->name('file-access-requests.reject');
});

Route::middleware('auth')->group(function () {
  Route::get('/staff/access-requests', [FileAccessRequestController::class, 'staffIndex'])
    ->name('staff.access-requests');

  Route::get('/faculty/access-requests', [FileAccessRequestController::class, 'adviserIndex'])
    ->name('faculty.access-requests');
});
```

The email token should be accepted by a dedicated review endpoint, then redirected to the authenticated review page. Keep the final approve/reject actions protected by authentication and authorization. Do not expose the token in an API response or use a public `POST` endpoint without recipient verification.

### Step 9: Add policies and scopes

Add policy methods for:

- Viewing a request as its Adviser.
- Viewing a request as the eligible Lead Author.
- Approving/rejecting as Adviser.
- Recording Lead Author consent.
- Approving/rejecting as MCIIS Staff only after escalation.
- Viewing the Staff queue.

Update `ResearchPolicy::downloadFiles()` so the existing direct-access rules are explicit and tested: linked Students, the Adviser, Staff, and Administrators may download according to their relationship/role. Guests may download only through a requester-bound approved grant, never through a research-wide approved request lookup.

### Step 10: Add escalation and expiration processing

Create a scheduled command or queued job that runs daily:

1. Find active requests past `created_at + 7 days` with no Adviser approval.
2. Mark them `escalated` once, using a transaction or idempotency guard.
3. Notify all active MCIIS Staff by email.
4. Expose them in the Staff Access Requests queue.
5. Find unresolved requests past `expires_at` and mark them `expired`.
6. Notify the requester that no access was granted and that a new request may be submitted.

Confirmed hard bounce handling may trigger escalation early, but it must not grant access automatically.

### Step 11: Add the Staff and Faculty queue data

Use the existing pages rather than creating duplicate dashboards:

- `resources/js/pages/staff/research/index.tsx`: add an Access Requests section or navigation button. Staff sees escalated requests and can filter by status, file type, research, and age.
- `resources/js/pages/faculty/research/index.tsx`: add an Access Requests section or button. Advisers see only requests for research they advise.
- Use one shared request detail page/component for the review state and actions.

Recommended queue columns:

| Column              | Example                                |
| ------------------- | -------------------------------------- |
| Request             | `#1042`                              |
| Research            | Research title                         |
| File                | Manuscript / Approval Sheet            |
| Requester           | Full name and email                    |
| Status              | Pending Adviser / Escalated / Approved |
| Lead Author consent | Not received / Received                |
| Requested           | Date/time                              |
| Action              | Review                                 |

The Lead Author marker is needed. It prevents the Adviser from wondering whether the author has already responded and lets Staff understand the request history without opening every email.

### Step 12: Update the Browse modal

In `resources/js/components/browse/research-details-modal.tsx`:

1. Read server-provided capabilities instead of inferring authorization only from guest state.
2. Show direct Download for an authorized Adviser, linked Student, Staff member, or Administrator.
3. Show Request Access for an authenticated user who is not already authorized.
4. Redirect guests to SSO instead of calling the public request endpoint.
5. Show the request status after submission: pending, Lead Author consent received, escalated, approved, rejected, or expired.
6. Do not expose approval tokens in the Browse page.

### Step 13: Add email templates

Add mail classes and templates under `app/Mail` and `resources/views/emails`:

- `FileAccessRequestMail`: Adviser final-approval email.
- `FileAccessConsentMail`: optional Lead Author consent email.
- `AdviserConsentReceivedMail`: sent immediately when Lead Author approves first.
- `FileAccessRequestEscalatedMail`: sent to all MCIIS Staff after seven days or a confirmed hard bounce.
- `FileAccessGrantedMail`: sent after Adviser or Staff approval.
- `FileAccessRequestRejectedMail`: sent after rejection.
- `FileAccessRequestExpiredMail`: sent after fourteen days without a decision.

Use the requester’s full name and email in the approver context as decided. Never include raw approval tokens in logs or user-facing status messages.

### Step 14: Add tests before enabling the feature

Create Feature tests for:

- Guest is redirected/rejected and cannot create a request.
- Non-`@usep.edu.ph` accounts cannot submit a request.
- Adviser receives the initial request email.
- Eligible Lead Author receives the consent email.
- No Lead Author results in Adviser-only notification.
- Lead Author consent leaves the request pending.
- Adviser receives the consent update email and queue marker.
- Adviser approval grants access and emails the requester.
- Linked Students and Advisers download directly without a request.
- Unrelated authenticated users cannot download directly.
- Staff sees only the intended queue and can act only after escalation.
- Hard bounce escalates without auto-approving.
- Day 7 escalation is idempotent.
- Day 14 expiration denies access.
- Rejection blocks the current request but allows a later new request.
- Expired, used, wrong-role, and wrong-user tokens are rejected.
- Duplicate approvals are harmless.
- Simultaneous approvals cannot create inconsistent state.

Run the focused PHP tests and frontend tests before changing unrelated workflow code.

### Step 15: Enable the workflow for all repository research

Because the project is still in development, apply the new request behavior to all existing and future research records. Do not split behavior by research age. Existing records should use their current Adviser and Lead Author relationships; records without a usable Lead Author use Adviser-only notification.

After tests pass, rebuild the development database if migrations were edited directly:

```powershell
php artisan migrate:fresh --seed
php artisan test --filter=GuestFileRequest
npm run build
```

Do not run `migrate:fresh` against shared or production data.

## Part 2B: Copy-Ready VS Code AI Implementation Prompt

Copy the prompt below into VS Code Chat or use it as the task prompt for an implementation agent. It tells the agent to inspect the repository first, implement the workflow in phases, validate each phase, and stop when a security or policy assumption cannot be verified.

```text
You are implementing the MCIIS Manuscript and Approval Sheet Access Request Workflow in this Laravel 12 + Inertia React repository.

SOURCE OF TRUTH
Use FILE_ACCESS_REQUEST_IMPLEMENTATION_CHECKLIST.md, especially Part 2A and Parts 5-9. Implement the selected Adviser-Final Hybrid policy:

- Requesters must authenticate through the existing Google SSO flow and use a valid @usep.edu.ph account before creating a request.
- The Faculty Adviser is the final academic approver.
- An eligible Lead Author may provide consent, but Lead Author consent alone never grants file access.
- The Adviser may approve directly when the Lead Author is unavailable.
- MCIIS Staff may approve or reject only after escalation, or immediately when no Adviser exists.
- Linked Student researchers, the Adviser, MCIIS Staff, and Administrators use normal direct-download authorization and do not submit requests for research they already own or administer.
- A request is bound to the authenticated requester, research, and file type. Never grant access because any approved request exists for the research.
- Rejection closes the current request. The same requester may submit a new request later.

Before editing, inspect the checklist, app/Models/GuestFileRequest.php, its migration, routes, controllers, ResearchPolicy, Research relationships, authentication/SSO routes, mail classes, Browse components, and related tests. If another document conflicts with the Adviser-Final policy above, report the conflict and follow the checklist unless the user explicitly changes the policy. Do not silently implement an either/or first-responder workflow.

WORKING RULES
1. Make small, local changes. Preserve existing Laravel, Inertia, React, and route-helper conventions.
2. Before each edit, identify the owning code path, one falsifiable hypothesis, and one focused check.
3. Frontend capabilities are presentation only; enforce authorization server-side.
4. Never store raw approval tokens, expose them in Inertia props, or mutate approval state on GET.
5. Use transactions and lockForUpdate() for approval, rejection, escalation, and expiration.
6. Queue mail after the request transaction commits. Do not let email delivery determine database success.
7. Make transitions idempotent. Repeated clicks/jobs must not overwrite actors/timestamps or create duplicate grants.
8. Do not run migrate:fresh unless the user confirms this is a disposable development database.
9. Do not commit changes or revert unrelated user changes.

IMPLEMENTATION ORDER

Phase 0 - Reconnaissance and baseline
- Check git status. Search for all GuestFileRequest, guest request, download authorization, researcher/adviser relationships, SSO callbacks, staff roles, mail, and related tests.
- Identify the current request endpoint, download endpoint/policy, Browse modal, and available test commands.
- Run the narrowest relevant existing tests before editing. Record missing coverage or pre-existing failures.
- Report the actual files and symbols that own each behavior, then proceed only after this inspection.

Phase 1 - Database and domain model
- Add migrations for status, Adviser-final policy, hashed role-specific approval tokens, expiry/escalation timestamps, approval actors/timestamps, email delivery state, rejection reason, and any secure requester-bound access grant required by the download design.
- Add approval/rejection and escalation audit tables where consistent with existing infrastructure.
- Add appropriate foreign keys and indexes.
- Update GuestFileRequest casts, fillable/guarded fields, relationships, scopes, and domain methods.
- Centralize transitions in one service or domain method; controllers must not set timestamps/status independently.
- Prevent duplicate active requests for the same requester, research, and file type.
- Run focused migration/model tests before continuing.

Phase 2 - Secure request creation and downloads
- Protect request creation with the existing auth middleware and enforce the exact institutional email rule.
- Validate research, file type, published/available file, and requester identity.
- Refuse requests from linked Students, Lead Authors, Advisers, Staff, and Administrators who already have direct access.
- Return an existing active request for duplicates.
- Make download authorization explicit and requester-bound. Never use a research-wide approved-request lookup.
- Add focused tests for guests, invalid domains, stakeholders, unrelated users, duplicates, and direct downloads.

Phase 3 - Approval tokens and workflow service
- Generate separate cryptographically random Adviser and Lead Author tokens. Store only hashes with role, request, expiry, and used timestamp.
- Add authenticated review routes and CSRF-protected POST approve/reject routes. Token GET only opens review; it never mutates state.
- Verify token hash, role, expiry, request status, and authenticated account identity inside the transaction.
- Lead Author consent changes status to pending_adviser_approval and never grants access.
- Adviser approval grants the requester-bound file access and approves the request; Adviser rejection stores a reason.
- Escalated Staff approval/rejection follows the same grant/rejection rules and records Staff as actor.
- Final states return the current result on repeated actions.
- Add concurrency tests for simultaneous approvals and duplicate grant prevention.

Phase 4 - Recipients, mail, and scheduling
- Resolve the current Adviser and an eligible active Lead Author from actual repository relationships.
- Always notify the Adviser when present; notify the Lead Author only when eligible. If no Adviser exists, escalate to authorized MCIIS Staff.
- Add mail classes/templates using existing conventions. Never log raw tokens.
- Dispatch queued mail after commit and record delivery/bounce state if existing configuration supports it.
- Add a daily command/job: escalate unresolved requests after 7 days with an idempotent audit event and Staff notification; expire unresolved requests after 14 days without granting access.
- Test recipients, queued dispatch, missing/inactive approvers, escalation idempotency, bounce behavior if implemented, and expiration.

Phase 5 - Routes, queues, and frontend
- Add protected review, approve, reject, Staff queue, and Adviser queue routes using existing conventions.
- Filter queues server-side: Advisers see only research they advise; Staff sees the intended escalated queue.
- Update the Browse details modal to consume server capabilities. Guests go through SSO; authorized stakeholders see Download; other authenticated users see Request Access.
- Show request status and Lead Author consent marker without exposing approval credentials.
- Use existing Inertia/UI patterns and add focused frontend tests for capabilities, guest redirect, status, and token non-exposure.

Phase 6 - Verification and handoff
- Run focused Pest tests, then the full PHP suite when practical.
- Run relevant Vitest tests, npm run types, npm run build, and the repository's PHP syntax/format checks.
- Inspect the final diff and git status for raw tokens, public mutation routes, research-wide access checks, unrelated changes, or transitions outside the workflow service.
- Report changed files, tests and results, migration instructions, assumptions, and pre-existing failures.

STOP AND ASK FOR CLARIFICATION if the repository cannot reliably identify the Adviser, Lead Author, Staff, or stakeholders; SSO behavior contradicts the stated domain rule; downloads cannot support requester-bound grants; migrations risk shared data; or the requested change would alter the selected Adviser-Final policy.

BEGIN NOW: Start with Phase 0. Do not edit until inspection identifies one falsifiable hypothesis and one focused check. Then implement one phase at a time and validate immediately after each substantive edit.
```

---

## Part 3: The Core Problem: Inactive Lead Author Emails

### Why This Matters

- Lead authors graduate within 1-4 years post-completion
- Institutional email access deactivated shortly after
- Theses remain in repository 10-20+ years
- **40-50% of theses 5+ years old have inactive lead author emails**
- Sequential approval (Lead Author → Adviser) creates permanent deadlock

### Real-World Timeline

```
Year 0: Jane graduates, marked as Lead Author
Year 2-3: jane@usep.edu.ph deactivated
Year 5+: External researcher requests access
        → Email sent to dead email address
        → Request stuck forever (no admin override exists)
```

---

## Part 4: Three Approval Workflow Options

### Option A: Sequential Approval ❌ NOT RECOMMENDED

```
Guest Request → Lead Author approves → Adviser approves → Access Granted
```

**Deadlock Risk:** 🔴 **40-50% of old theses**
**Verdict:** Unacceptable — requires complex admin overrides

| Scenario      | Outcome           | Frequency |
| ------------- | ----------------- | --------- |
| Both active   | ✅ Works          | 50%       |
| Lead inactive | 🔴**STUCK** | 40%       |
| Both inactive | 🔴**STUCK** | 10%       |

---

### Option B: Adviser-Only Approval ⚠️ VIABLE IF POLICY ALIGNS

```
Guest Request → Adviser approves → Access Granted
```

**Deadlock Risk:** ✅ None
**Lead Author Authority:** 🔴 Removed
**Scalability:** ✅ Perfect

**Best for:** Institutions where Faculty owns all research IP
**Not suitable for:** Student-author-rights-focused institutions

---

### Adviser-Final Hybrid with MCIIS Staff Fallback ✅ SELECTED

```
TIER 1 (Days 0-7): Email Adviser; notify Lead Author when available
  → Lead Author approval is recorded as consent
  → Adviser approval → Access granted immediately
  
TIER 2 (Days 7-14): Auto-escalate to authorized MCIIS Staff
  → MCIIS Staff approves/rejects
    → No request permanently stuck
  
TIER 3 (Day 14+): Manual institutional intervention
```

**Deadlock Risk:** 🟢 Low (only if both approvers and all MCIIS Staff fail to act)
**Lead Author Authority:** ✅ Consent preserved
**Adviser Authority:** ✅ Final approval authority
**Scalability:** ✅ Works for any thesis age

---

## Part 5: Recommended Solution - Adviser-Final Hybrid Details

### Database Schema Changes (New Fields)

**On `guest_file_requests` table:**

- `approval_policy` enum: 'adviser_final' (default), with legacy values only if historical records require them
- `escalation_level` enum: 'lead_adviser' → 'mciis_staff' → 'institution'
- `escalated_at` timestamp, `escalated_to_staff_id` foreign key when assigning a specific Staff reviewer; the initial escalation may notify all Staff without assigning one person
- `approval_token` unique string (64 chars)
- `expires_at` timestamp (14 days)
- `lead_email_status`, `adviser_email_status` enum: pending/sent/bounced/hard_bounce/invalid
- `is_auto_escalated` boolean
- `lead_approved_by`, `adviser_approved_by` foreign keys
- `email_delivery_attempts` integer

**New Audit Tables:**

- `file_request_email_logs` – Track bounces, opens, clicks
- `file_request_escalations` – Audit trail of escalations

### Email Flow

**Initial Request (to Adviser, with optional Lead Author notification):**

```
Subject: File Access Request for Research: [Title]

Dear [Name],

A user requested access to [Manuscript/Approval Sheet]:
Research: [Title]

✅ Approve:  [domain]/file-requests/[token]/approve?action=approve
❌ Reject:   [domain]/file-requests/[token]/approve?action=reject

⚠️ The Lead Author may provide consent, but the Faculty Adviser gives the final approval.
  If the Lead Author is unavailable, the Adviser may approve directly.

Note: After 7 days of no response, this will be escalated
to MCIIS Staff for review.

Expires: [Date + 14 days]
```

**Escalation Email (after 7 days, if no response):**

```
Subject: ESCALATION: File Access Request Pending

Dear MCIIS Staff,

An access request has been pending 7+ days:

Research: [Title]
Lead Author: [Name] - Status: [bounced/no response]
Adviser: [Name] - Status: [bounced/no response]

REVIEW & APPROVE: [domain]/staff/file-requests/[token]

Once approved, access is granted immediately.
No further approval needed.
```

### Key Features

- **Intelligent bounce detection:** Hard bounces trigger immediate escalation
- **Soft bounce retry:** Up to 3 retry attempts
- **Adviser is the final approver:** Lead Author approval is recorded but does not release the file
- **MCIIS Staff fallback:** Automatic after 7 days
- **Complete audit trail:** Every action logged with timestamp and approver

### Approval Logic

```php
// When Lead Author approves
→ status = 'pending'
→ lead_approved_at = now()
→ lead_approved_by = user_id
→ Wait for Adviser approval

// OR when Adviser approves
→ status = 'approved'
→ adviser_approved_at = now()
→ adviser_approved_by = user_id
→ Lead Author approval may already exist, or may be unavailable under the Adviser fallback

// After 7 days with no approval
→ Auto-escalate to MCIIS Staff
→ escalation_level = 'mciis_staff'
→ Send escalation email
→ MCIIS Staff can approve/reject
```

### Direct access for research stakeholders

The access-request workflow is for users who are not already authorized to access the file. It must not force research stakeholders to request access from themselves:

- **Faculty Adviser:** may download the Manuscript and Approval Sheet for research they advise.
- **Student researcher:** may download the files for research to which their account is linked, whether or not they are the Lead Author.
- **Lead Author:** receives the same direct download access as any linked Student researcher; being Lead Author gives consent authority in the request workflow, not an exclusive download privilege.
- **MCIIS Staff and Administrator:** may download files for repository administration.

These permissions must be enforced server-side by the download policy. The Browse UI may show Download instead of Request Access for these users, but the UI is not the security boundary.

---

## Part 6: Implementation Phases

| Phase           | Tasks                                  | Duration             |
| --------------- | -------------------------------------- | -------------------- |
| **1**     | Database schema + model enhancements   | 2-3 days             |
| **2**     | Email service + bounce listener        | 2-3 days             |
| **3**     | Scheduler job (daily escalation check) | 1-2 days             |
| **4**     | Controller logic (request + approval)  | 2-3 days             |
| **5**     | Frontend (request + landing pages)     | 2-3 days             |
| **6**     | Staff request view + approval controls | 3-4 days             |
| **7**     | Testing + UAT                          | 3-5 days             |
| **TOTAL** |                                        | **15-23 days** |

---

## Part 7: Security & Considerations

✅ **Strong tokens** (64-char random strings)
✅ **Rate limiting** on approval attempts
✅ **Server-side authorization** (no relying on frontend)
✅ **Email domain validation** (@usep.edu.ph for SSO)
✅ **Audit logging** of all approvals/escalations
✅ **Expiration enforcement** (14 days)
✅ **Guest user privacy** (no details exposed in emails)

---

## Part 8: Comparison Matrix - Final Decision

| Criterion                           | Option A           | Option B              | Option C              |
| ----------------------------------- | ------------------ | --------------------- | --------------------- |
| **Deadlock Risk**             | 🔴 40-50%          | ✅ None               | 🟢 ~5%                |
| **Lead Author Authority**     | ✅ Yes             | 🔴 No                 | ✅ Yes                |
| **Adviser Authority**         | ⚠️ Secondary     | ✅ Primary            | ✅ Full               |
| **Speed**                     | 🔴 Slow (2 steps)  | ✅ Fast               | ✅ Fast (1st wins)    |
| **Complexity**                | 🟡 Medium          | ✅ Simple             | 🟡 Medium             |
| **Admin Overhead**            | 🔴 High            | ✅ None               | 🟡 Low (~5%)          |
| **Scalability (20yr theses)** | 🔴 Fails           | ✅ Works              | ✅✅ Perfect          |
| **Institutional Fit**         | ⚠️ Variable      | 🟡 Policy-dependent   | ✅ Universal          |
| **Recommendation**            | ❌ NOT RECOMMENDED | ⚠️ IF policy aligns | ✅ HIGHLY RECOMMENDED |

---

## Part 9: What Approvers See

### For Lead Author/Adviser (Email Link)

```
"Click to approve or reject this request.
If the other party approves first, you'll see a notification.
Request expires in 14 days."

[APPROVE] [REJECT] [VIEW DETAILS]
```

### For MCIIS Staff (If Escalated)

```
"ESCALATED REQUEST

Research: [Title]
Original Submitter: [Email]
Requested File: Manuscript

Lead Author: Jane Doe (jane@usep.edu.ph)
    Status: EMAIL BOUNCED (hard bounce detected)
    Last Attempt: 7 days ago

Adviser: Dr. Smith (smith@usep.edu.ph)
    Status: NO RESPONSE (7 days with no interaction)

DECISION REQUIRED:
You can approve or reject this request directly.
Once you decide, the guest user will receive immediate access/denial.

[APPROVE] [REJECT WITH REASON] [CONTACT ADVISER MANUALLY]"
```

---

## Part 10: Decision Record and Remaining Decisions

# ✅ Decisions Already Made

The following choices are now recorded and should not be revisited unless institutional policy changes:

| Decision             | Confirmed policy                                                                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approval model       | **Adviser-final hybrid:** Notify the Lead Author when a usable account/email exists, but the Adviser is the final institutional approver. Lead Author approval alone does not grant access. If the Lead Author is unavailable, the Adviser may approve directly. |
| Escalation timer     | Escalate after**7 days** without approval.                                                                                                                                                                                                                       |
| Request expiration   | Expire requests after**14 days**.                                                                                                                                                                                                                                |
| Bounce handling      | **Yes:** a confirmed hard bounce triggers escalation without waiting seven days.                                                                                                                                                                                 |
| Escalation recipient | **All active MCIIS Staff members** receive the escalation notification and can act on it.                                                                                                                                                                        |
| SSO                  | **Required:** the requester must authenticate through Google SSO with a valid `@usep.edu.ph` account before submitting a request.                                                                                                                              |
| No Lead Author       | Send the request to the**Faculty Adviser only**. The same Adviser-only rule applies when the Lead Author is known but has no usable active account.                                                                                                              |
| Email context        | Include detailed research, file, requester, deadline, and escalation context. Do not include secrets or approval tokens in the visible message.                                                                                                                        |
| Lead Author update   | When the Lead Author approves first, send the Adviser an immediate update email and mark the request in the Adviser and Staff queues as**Lead Author consent received — Adviser approval required**.                                                            |
| Repository coverage  | Apply the workflow to**all research records in the repository** while the system is still in development.                                                                                                                                                        |
| Rejection            | Reject the current request permanently, but allow the same authenticated requester to submit a new request later.                                                                                                                                                      |
| Requester visibility | Approvers may see the requester’s first name, middle name when available, last name, and email address.                                                                                                                                                               |
| Testing              | Run all listed scenarios, including inactive accounts, bounces, Staff escalation, rejection, expiry, duplicate clicks, and simultaneous approvals.                                                                                                                     |
| Staff non-response   | If no MCIIS Staff member acts, the request remains unresolved and expires after 14 days. No access is granted automatically.                                                                                                                                           |

### Recommended placement in the existing application

Do not create separate permanent dashboards for Faculty and MCIIS Staff. Add request management to the existing pages:

- **MCIIS Staff:** add an “Access Requests” section, filter, or button to `Manage Research` at `/staff/research`. Staff can review escalated and active requests there.
- **Faculty Adviser:** add an “Access Requests” section or button to `My Researches` at `/faculty/my-researches`. Advisers see requests only for research they advise.
- **Approval detail:** use one shared request detail/approval page reached from either existing page or from an email link. This avoids duplicating the workflow in two dashboards.
- **MCIIS Staff fallback:** the first version can use the shared request detail page and email links. A larger dashboard is useful for queues, filters, and audit history, but is not required to enforce the workflow.

The backend must enforce these scopes. Hiding a button in the frontend is not authorization.

### How MCIIS Staff escalation works

1. Create the request with status `pending` and send an approval link to the Adviser. Send an informational/consent link to the Lead Author only when a usable active account/email is available.
2. Record Lead Author approval as `lead_approved_at`, but do not grant access yet. Access is granted only when the Adviser approves, or when the request reaches an explicitly authorized Staff override path.
3. A scheduled daily job finds unresolved requests older than seven days, marks them `escalated`, and emails **all active MCIIS Staff members**.
4. Staff also sees the request in an **Access Requests** section on `Manage Research`. The email is an alert and shortcut, not the only way to find the work.
5. Staff opens the shared request detail page, reviews the research and requester context, and approves or rejects it.
6. Staff action is recorded with actor, timestamp, reason, and the escalation event. If nobody acts, the request expires after 14 days and access is not granted. A request must never be auto-approved solely because an email bounced or because a timer elapsed.

Use a role-based query for all active MCIIS Staff accounts. Add a navigation item or badge linking to the Access Requests section, but do not create a second permanent dashboard. Do not infer department ownership from a `program_id` on `users` unless that relationship actually exists in the schema.

### Lead Author approval notification and queue marker

When the Lead Author approves before the Adviser:

1. Record the Lead Author, timestamp, and consent action.
2. Keep the request status as `pending_adviser_approval`; do not grant file access.
3. Send the Adviser an email immediately stating: **“The Lead Author has approved this request. Your final approval is still required before the requester can access the file.”** Include an approval link.
4. Display the queue marker **Lead Author consent received — Adviser approval required** in both the Adviser’s `My Researches` access-request section and the Staff `Manage Research` access-request section.
5. If the Adviser approves, change the request to `approved` and notify the requester. If the Adviser rejects, change it to `rejected` and notify the requester.

The email is useful because it actively prompts the Adviser. The queue marker is still necessary because email can be missed, delayed, or filtered. The database status is the authoritative state; the email and UI are two ways of communicating it.

### Lead Author and Adviser approval policy

Use the Adviser-final hybrid to match the institutional approval requirement without creating a deadlock:

- If the Lead Author has an active account, their approval is recorded as author consent, but it is not sufficient by itself to release the file.
- The Adviser approves after the Lead Author when both are available; the Adviser’s approval grants access.
- If the Lead Author’s institutional email is inactive, the Adviser may approve without waiting for the Lead Author.
- If no Lead Author exists, only the Adviser is notified.
- If the Adviser approves before the Lead Author responds, access is granted immediately and the Lead Author’s later link becomes informational only.
- If neither responds by day 7, all MCIIS Staff receive the escalation.

This preserves Lead Author participation without making a graduate’s deactivated email a single point of failure. It also reflects the rule that the Adviser is the institutional authority who must approve access.

### What “log who viewed the request” means

It means recording a non-mutating view event such as: “Staff member X opened request Y at time Z.” This is separate from recording an approval, rejection, escalation, or email delivery event. It is useful for audit and troubleshooting but is not required for the first implementation.

---

# ⚠️ Remaining Decisions Needed Before Implementation

Only the items below remain open. The older option lists below are retained as background, but the decision record above is authoritative.

---

### **1. APPROVAL WORKFLOW CHOICE — DECIDED: ADVISER-FINAL HYBRID**

**Question:** Which approval model should we implement?

- [ ] **Adviser-final hybrid:** Lead Author consent when available; Adviser approval grants access

  - *Chosen when:* Institution values both Lead Author + Adviser authority
  - *Best for:* Long-term archives (10+ year theses)
  - *Staff burden:* Low; only unresolved requests are escalated
- [ ] **Option B (Alternative):** Adviser-only approval

  - *Chosen when:* Faculty owns all research IP
  - *Best for:* Faculty-driven research institutions
  - *Staff burden:* None
- [ ] **Option A (Not Recommended):** Sequential approval

  - *Only if:* Custom admin override mechanism will be built
  - *Risk:* Deadlock on ~40-50% of old theses

**Recorded decision:** Lead Author approval is recorded as consent. The Adviser is the final approver and may approve without waiting when the Lead Author is unavailable.

---

### **2. ESCALATION SETTINGS — DECIDED: 7 DAYS / 14 DAYS**

**Question:** After how many days should requests auto-escalate to MCIIS Staff?

- [ ] 7 days (recommended) - Balances responsiveness with courtesy
- [ ] 5 days (faster) - More aggressive escalation
- [ ] 10 days (slower) - Gives more time
- [ ] Custom: _____ days

**Question:** What is the total request expiration time?

- [ ] 14 days (recommended) - Standard 2-week window
- [ ] 21 days (longer) - More time for multiple follow-ups
- [ ] 7 days (shorter) - Urgent requests only
- [ ] Custom: _____ days

**Recorded decisions:** Escalate after 7 days; expire after 14 days.

---

### **3. EMAIL BOUNCE HANDLING — DECIDED: ESCALATE ON HARD BOUNCE**

**Question:** Should hard-bouncing emails trigger immediate escalation?

- [ ] **Yes** (recommended) - Escalate same day if email bounces

  - Pros: Doesn't waste 7 days on dead email
  - Cons: May escalate prematurely if email is temporarily down
- [ ] **No** - Wait full escalation period

  - Pros: Gives email system time to recover
  - Cons: Delays resolution for genuinely dead emails

**Recorded decision:** Yes, record confirmed hard bounces and escalate when the request still lacks an eligible approver. A bounced Lead Author alone does not need to interrupt the Adviser’s approval path.

---

### **4. ESCALATION RECIPIENT — DECIDED: MCIIS STAFF**

**Question:** How should the system notify MCIIS Staff?

- [X] **All active Staff members** - Email all active MCIIS Staff accounts and show the request in `Manage Research`

**Recorded decision:** All active MCIIS Staff members receive the email. The Staff navigation includes an Access Requests link or badge leading to the queue on `Manage Research`.

---

### **5. SSO ENFORCEMENT — DECIDED: REQUIRED**

**Question:** Should unauthenticated users be required to login before requesting?

- [ ] **Yes** (current requirement) - Must have valid @usep.edu.ph email

  - Ensures tracked identity
  - Complies with institution policy
- [ ] **No** - Allow anonymous/guest requests

  - More open access
  - Loses requester identity tracking

**Recorded decision:** Yes, require Google SSO with a valid `@usep.edu.ph` email.

---

### **6. LEAD AUTHOR FALLBACK — DECIDED: ADVISER ONLY**

**Question:** If there's no Lead Author linked to research, who should receive initial approval email?

- [ ] **Adviser only** - Skip lead author entirely
- [ ] **All co-authors** - Send to all researchers
- [ ] **Escalate immediately** - Go straight to MCIIS Staff
- [ ] **Reject request** - Don't allow requests if no lead author

**Recorded decision:** Adviser only.

---

### **7. STAFF ESCALATION INTERFACE — DECIDED: EMBED IN EXISTING PAGES**

**Question:** Should request management be embedded in existing Staff and Faculty pages?

- [ ] **Phase 1 (MVP):** Core escalation logic only

  - Staff use direct email links to approve/reject
  - No separate dashboard
  - Timeline: 15-17 days
- [ ] **Phase 1 + Dashboard:** Full admin interface

  - The existing Manage Research page lists all escalations
  - Bulk actions support
  - Email audit trail visible
  - Timeline: 18-23 days

**Recorded decision:** Embed it in `Manage Research` and `My Researches`; use one shared request detail page. A separate dashboard is not required.

---

### **8. EMAIL COMMUNICATION TONE — DECIDED: DETAILED CONTEXT**

**Question:** Should escalation emails include context about why it's escalated?

- [ ] **Detailed** (recommended) - Explain lead author email bounced, etc.

  - Helpful to admin
  - More professional
  - Slightly longer email
- [ ] **Brief** - Just "Request needs admin review"

  - Faster to write
  - Less information

**Recorded decision:** Detailed context.

The Lead Author follow-up email is sent immediately after Lead Author consent. It is not a cancellation email and it does not imply that access has already been granted.

---

### **9. AUDIT & LOGGING — PARTIALLY DECIDED: ACTIONS, DELIVERY, AND ESCALATION EVENTS**

**Question:** What level of audit logging is needed?

- [ ] **Basic** - Log who approved, when, and action
- [ ] **Detailed** (recommended) - Also log email bounces, escalation reasons, all state changes
- [ ] **Comprehensive** - Also log who viewed request, IP addresses, etc.

**Recorded decision:** Log approval/rejection, actor, timestamps, email delivery/bounce events, escalation reasons, and state changes. Request-view events and IP addresses are not required for the initial implementation.

---

### **10. TESTING SCOPE**

**Question:** Which scenarios should we explicitly test?

- [ ] ✅ Both parties responsive (approval within 1 day)
- [ ] ✅ Lead author inactive, adviser responds
- [ ] ✅ Adviser inactive, lead author responds
- [ ] ✅ Both inactive, auto-escalate to admin
- [ ] ✅ Email hard bounce detected
- [ ] ✅ Admin approval after escalation
- [ ] ✅ Rejection workflow
- [ ] ✅ Token expiration
- [ ] ✅ Duplicate approval attempts
- [ ] ✅ Race condition (both approve simultaneously)
- [ ] Other: _______________

**Recorded decision:** Confirm all listed scenarios.

---

### **11. DEVELOPMENT ROLLOUT — DECIDED: ALL RESEARCH**

**Meaning:** This is not asking about production deployment. It asks whether the feature is enabled for all repository records during development, or temporarily limited behind a configuration switch while it is being tested.

- [X] **All research in development** - Apply the workflow to existing and future repository records now
- [ ] **Feature flag during development** - Keep the same all-record scope, but allow developers to turn the feature off temporarily

**Recorded decision:** Apply the workflow to all existing and future research records during development. A feature flag is optional developer tooling, not a separate rollout by research age.

---

### **12. PILOT TESTING — DECIDED: TEST ALL SCENARIOS**

**Question:** Before full rollout, should we pilot with real requests?

- [ ] **Yes** (recommended) - Test with 50+ requests from actual researchers

  - Validates email bounce handling
  - Finds real-world issues
  - Timeline: +1-2 weeks
- [ ] **No** - Test only with internal QA data

  - Faster deployment
  - Misses real-world scenarios

**Recorded decision:** Test all listed scenarios. A real-user pilot is optional and is not required before implementation in the development environment.

---

### **13. FALLBACK POLICY: WHAT IF MCIIS STAFF ISN'T AVAILABLE?**

**Question:** If all active MCIIS Staff receive the escalation but nobody acts, what happens?

- [ ] **Reassign** - Notify a different Staff group or named Department Head
- [ ] **Auto-approve** - Grant access without a human decision
- [ ] **Manual review** - Queue for Department Head or institutional review
- [X] **Expire** - Leave unresolved requests pending until the 14-day deadline, then expire them without granting access

**Recorded decision:** If nobody acts, nothing happens; the request expires after 14 days and the requester may submit a new request later.

---

### **14. RESEARCHER DATA PRIVACY**

**Question:** What information should approvers see about the requester?

- [X] **Name and email** - First name, middle name when available, last name, and email
- [ ] **Basic identity** - Email only, no name
- [ ] **Anonymous** - Just "A guest user requested access"
- [ ] **Partial** - Email domain only (@usep.edu.ph or outside)

**Recorded decision:** Name and email only for the request context; do not expose tokens or unrelated audit data.

---

### **15. REJECTION HANDLING**

**Question:** If Lead Author or Adviser rejects request, what happens?

- [X] **Permanent denial for this request** - The requester may submit a new request later
- [ ] **Can retry after 30 days** - Requester can try again
- [ ] **Notify admin** - Auto-escalate rejections for review
- [ ] **Admin override** - Admin can override rejection

**Recorded decision:** Reject the current request permanently, but allow the same authenticated user to submit a new request.

---

## Summary: Remaining Decisions

Please answer only these two policy items. All other decisions are recorded above:

```
1. **MCIIS Staff non-response:** Decided: no further escalation or automatic approval. The request expires after 14 days without granting access.
2. **Feature flag:** Do you want a developer-only switch to temporarily disable this workflow while testing, even though it is intended for all research records?
```

Once these two choices are confirmed, we can:

1. ✅ Finalize technical specifications
2. ✅ Create implementation tickets
3. ✅ Begin Phase 1 (database + models)
4. ✅ Complete full implementation in 15-23 days

---

**Next Step:** Fill out the checklist above and reply with your decisions!
