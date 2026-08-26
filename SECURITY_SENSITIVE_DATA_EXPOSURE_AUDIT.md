# Sensitive Data Exposure Audit

**Scope:** This document covers only one security domain: sensitive, private, or unnecessary data included in browser-facing Inertia, JSON, and download-related responses. It is not a complete security audit of the application.

**Audit date:** 2026-08-25
**Status:** Findings are based on source-code review and the captured `/users` response. Verify each fixed route using an authenticated browser session and automated tests before release.

## Why this matters

Anything returned to an Inertia page or JSON endpoint is available to the person using that browser through DevTools, saved browser data, extensions, and a compromised device. Authorization decides *who* can request data; it does not make it safe to send passwords, authentication tokens, or unnecessary personal data to that person.

Laravel's `$fillable` property does **not** control response data. Use `$hidden` to prevent sensitive model attributes from serialization, and use explicit response objects/resources to send only the fields a page needs.

## Findings

| ID     | Severity | Status             | Issue and exposure path                                                                                                                                                                                                                                                                                                                                                      |
| ------ | -------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SDE-01 | Critical | Confirmed          | `User` has no `$hidden` list. Raw serialized users include `password` hashes and `remember_token` values, plus Google IDs and personal data. Confirmed in the captured `/users` Inertia response.                                                                                                                                                                  |
| SDE-02 | Critical | Confirmed          | User audit logs persist complete`User::getAttributes()` and `getOriginal()` arrays. This copies password hashes and persistent-login tokens into `old_values` / `new_values`. The users edit view and log endpoints return those arrays, allowing the exposure to remain even after the `User` model is hidden.                                                    |
| SDE-03 | High     | Confirmed          | The shared`auth.user` prop serializes the complete authenticated `User` model on every Inertia page. Without a response allow-list, it exposes more account and profile information than most pages require.                                                                                                                                                             |
| SDE-04 | High     | Confirmed          | Raw`User` models are returned by user-management and log relations. The users index/edit pages, generated-report relations, and several log relations inherit SDE-01 unless they use an explicit safe representation.                                                                                                                                                      |
| SDE-05 | High     | Confirmed          | The public`/browse` route serializes raw research records and explicitly includes each researcher's `email`. Anonymous visitors can retrieve researcher email addresses. The same raw research records also disclose stored manuscript and approval-sheet path fields.                                                                                                   |
| SDE-06 | Medium   | Confirmed          | Raw audit-log models are returned to browser pages and JSON detail endpoints. They include`ip_address`, `user_agent`, `old_values`, `new_values`, `metadata`, and relationship data. These are personal data and may contain arbitrary historic sensitive fields.                                                                                                  |
| SDE-07 | Medium   | Confirmed          | Raw`Faculty` records are sent to directory/list/show/edit Inertia pages. They include email, contact number, ORCID, educational attainment, specialization, research interests, and profile-picture path even when a page may not need all fields. Access is authenticated, but data minimization is not enforced.                                                         |
| SDE-08 | Medium   | Preventive finding | `GuestFileRequest.approval_token_hash` and `ResearcherInvitation.token_hash` are sensitive token-verifier fields and their models have no `$hidden` lists. Current reviewed guest-request controller responses manually choose safe fields, so no active exposure was found there. Hide these attributes now to prevent a future raw-model response from leaking them. |
| SDE-09 | Medium   | Confirmed          | A JSON response after student research-draft saving returns`$research->refresh()` as a raw model. This broadens the browser response to every research table column, including internal lifecycle fields and private file paths.                                                                                                                                           |

## Evidence locations

- SDE-01: `app/Models/User.php` (no `$hidden`) and `app/Repositories/UserRepository.php` (`User::with('roles')`).
- SDE-02: `app/Observers/UserObserver.php` (`getAttributes()`, `getOriginal()`) and `app/Repositories/UserRepository.php` (returns audit `old_values` / `new_values`).
- SDE-03: `app/Http/Middleware/HandleInertiaRequests.php` (`'user' => $request->user()?->load('roles')`).
- SDE-04: `app/Http/Controllers/UserController.php`, `app/Http/Controllers/Logs/LogController.php`, and `app/Http/Controllers/CompiledReportController.php`.
- SDE-05: `routes/web.php` defines `/browse` outside the `auth` middleware; `app/Repositories/ResearchRepository.php` selects `researchers...email` for the data returned by that page.
- SDE-06: `app/Http/Controllers/Logs/LogController.php`, `app/Http/Controllers/ResearchController.php`, and the audit-log models/observers.
- SDE-07: `app/Http/Controllers/FacultyController.php` passes full `Faculty` models to Inertia.
- SDE-08: `app/Models/GuestFileRequest.php` and `app/Models/ResearcherInvitation.php`.
- SDE-09: `app/Http/Controllers/ResearchController.php` returns `$research->refresh()` after a JSON draft save.

## Remediation order

1. **Contain the existing credential exposure.** Reset passwords for accounts whose hash was exposed, rotate/clear `remember_token` values, and invalidate persistent-login sessions. If the captured data came from production, treat it as an incident and record who had access to the response.
2. **Stop new credential leakage.** Add `$hidden` to `User` for `password`, `remember_token`, and `google_id`. Add `$hidden` to token-bearing models for `approval_token_hash` and `token_hash`.
3. **Fix audit records before showing them.** Do not store password, remember-token, OAuth identifier, session identifier, or other credential fields in audit `old_values` / `new_values`. Redact historic log data when rendering it; do not rely on `$hidden` because JSON nested inside audit columns is not automatically filtered.
4. **Replace raw model responses with allow-lists.** Create small Laravel API Resources or dedicated mapping methods for Users, audit logs, research, faculty, and compiled reports. Include only fields required by the specific screen and role.
5. **Fix anonymous research browsing.** Remove researcher email addresses and internal file paths from public browse data. Use a dedicated public-research resource. Return download URLs only after the download authorization check, not stored storage paths.
6. **Minimize audit and faculty data.** Do not return IP addresses, user-agent strings, raw audit snapshots, or full faculty profiles unless the user and screen have a documented business need.
7. **Make recurrence difficult.** Add feature tests that inspect actual Inertia/JSON responses and fail when forbidden keys are present.

## Step-by-step implementation guide

### 1. Create a field-classification list

For each model, list every column as one of:

- **Secret:** password hashes, remember tokens, OAuth IDs, token hashes, session IDs, reset tokens, API keys. Never return to the browser.
- **Personal data:** email, telephone number, student/faculty identifier, IP address, user agent, profile details. Return only when needed and authorized.
- **Internal-only:** audit snapshots, audit metadata, storage paths, internal workflow notes, soft-delete metadata. Do not send by default.
- **Public/display data:** only the fields intentionally shown on that exact screen.

Start with `User`, `UserAuditLog`, `FacultyAuditLog`, `ResearchEntryLog`, `ResearchAccessLog`, `KeywordSearchLog`, `Faculty`, `Research`, `GuestFileRequest`, and `ResearcherInvitation`.

### 2. Add model-level safety nets

Add `$hidden` properties for secret columns. This is a safety net for accidental Eloquent serialization, not the entire solution.

At minimum, hide:

- `User`: `password`, `remember_token`, `google_id`
- `GuestFileRequest`: `approval_token_hash`, `guest_session_id`
- `ResearcherInvitation`: `token_hash`

Do not add `$hidden` to fields a server-side method genuinely needs; hiding affects serialization, not normal database access.

### 3. Redact audit entries on write and display

Create one reusable redaction method with a deny-list, for example `password`, `remember_token`, `google_id`, token fields, session fields, and any file-access credential. Use it before assigning `old_values` and `new_values` in observers.

For existing audit rows, apply the same redaction when formatting browser responses. Decide separately whether historic database records need a migration/one-time cleanup, following your retention policy and after taking a backup.

### 4. Use explicit resources for every browser response

Create focused resources such as:

- `UserListResource`, `CurrentUserResource`, `UserEditResource`
- `AuditLogResource`
- `PublicResearchResource`, `ResearchManagementResource`
- `FacultyDirectoryResource`, `FacultyManagementResource`

Each resource must use an allow-list array. Do not use `$model->toArray()`, return a raw Eloquent model, or pass a raw paginator collection to Inertia for sensitive models.

### 5. Separate public and internal research data

Public browse results should contain only research details intended for anonymous visitors. Do not include researcher email addresses, user IDs, staff-only status/history, storage paths, or audit data.

For private roles, provide a different resource that includes only the extra data that role needs. Keep file download authorization in the download endpoint.

### 6. Test the actual responses

Add feature tests for every affected endpoint. Assert that the response body does not contain forbidden key names or values. Cover Inertia props, JSON routes, paginated lists, nested relations, log details, and error/success responses after saves.

Suggested forbidden fields: `password`, `remember_token`, `google_id`, `token_hash`, `approval_token_hash`, `guest_session_id`, `ip_address`, `user_agent`, `file_path`, `research_manuscript`, `research_approval_sheet`—unless a specific protected endpoint has an approved documented exception.

### 7. Verify manually before release

1. Sign in as administrator, staff, faculty, student, and anonymous visitor.
2. Open browser DevTools → Network → Fetch/XHR.
3. Check `/users`, user-edit pages, every log type, `/browse`, research list/show/edit responses, and all JSON endpoints.
4. Search each response for the forbidden field names above.
5. Confirm no password hash, remember token, raw token hash, researcher email on public browse, or audit IP/user-agent is present.
6. Run the full automated test suite and code formatter/linter.
7. Repeat the scan after future model, route, or Inertia-prop changes.

## Copy-paste prompt for VS Code

```text
Act as a senior Laravel and Inertia security engineer. Implement only the sensitive-data-exposure remediation described below; do not change unrelated behavior, routes, database schema, or UI unless needed for security.

Context: This Laravel/Inertia project accidentally serialized raw User models to browser responses. The captured /users response exposed password hashes and remember_token values. We must prevent this and other similar data disclosures.

Required work:
1. Add model-level $hidden protections:
   - App\Models\User: password, remember_token, google_id.
   - App\Models\GuestFileRequest: approval_token_hash, guest_session_id.
   - App\Models\ResearcherInvitation: token_hash.
2. Fix App\Observers\UserObserver so audit old_values/new_values never store password, remember_token, google_id, token fields, session fields, or any other credentials. Use one reusable redaction method/utility. Apply equivalent output redaction to historic audit log rows when serializing them.
3. Replace raw User model serialization with explicit allow-list mappings or Laravel API Resources for:
   - shared auth.user in HandleInertiaRequests;
   - users index and edit pages;
   - log endpoints/relations and compiled-report generatedBy relation.
   Only include fields each UI screen actually needs. Never return a password hash or remember token.
4. Protect public research browse data. The /browse route is public and its ResearchRepository currently loads researcher email. Remove researcher email, internal user IDs where not needed, and stored manuscript/approval-sheet paths from public responses. Use a dedicated public allow-list resource/mapping.
5. Replace raw audit-log response models with a role-appropriate allow-list. Exclude ip_address, user_agent, raw audit old_values/new_values, and internal metadata by default. If a management screen requires selected audit information, provide a redacted, explicitly mapped version.
6. Replace the raw $research->refresh() JSON response after draft saving with an explicit safe response.
7. Add feature tests that make actual requests and assert forbidden fields are absent in Inertia and JSON responses, including nested data. At minimum test: /users, a shared authenticated Inertia response, logs, public /browse, and draft-save JSON response.

Security rules:
- $fillable is not a response-security control.
- Use allow-lists, not block-lists, for browser-facing data.
- Do not expose stored file paths; keep authorization in download endpoints.
- Preserve existing authorization rules and UI contracts where safely possible.
- Do not log secrets in exceptions, test output, fixtures, or browser responses.

Before editing, inspect the relevant controllers, models, observers, routes, React/TypeScript props, and existing tests. After editing, run the targeted tests and report: files changed, tests run, any compatibility adjustments needed, and every endpoint manually worth checking in DevTools.
```

## Out of scope for this document

Do not treat this as proof that other security domains are safe. A later audit should separately cover authorization/object access, file-upload and download controls, authentication/session configuration, CSRF and rate limiting, input validation, dependency vulnerabilities, logging/monitoring, deployment secrets, backups, and infrastructure configuration.
