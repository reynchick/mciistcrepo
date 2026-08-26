# Security Review and Implementation Plan

**Scope:** Source-code and repository-configuration review performed on 2026-08-26. This complements `SECURITY_SENSITIVE_DATA_EXPOSURE_AUDIT.md`; it does not replace deployment, server, or penetration testing.

## What can be confirmed from source code

| ID | Priority | Status | Confirmed issue | Evidence |
| --- | --- | --- | --- | --- |
| SEC-01 | Critical | Confirmed | Research manuscripts, approval sheets, drafts, and generated reports are stored on Laravel's `public` disk. A web server with the normal `public/storage` symlink can serve these files directly, bypassing controller authorization when a path is known or guessed. | `config/filesystems.php`, `app/Services/ResearchService.php`, `app/Services/ResearchDraftService.php`, `app/Services/Reports/AbstractReportService.php` |
| SEC-02 | High | Confirmed | Report generation and research-matrix pages use only `auth` middleware. They query all active research with researchers and related data, but do not call the existing report/statistics policy. Any authenticated account may access data intended for administrators or staff. | `app/Http/Controllers/ReportGenerationController.php`, `app/Http/Controllers/ResearchMatrixController.php`, `app/Policies/ResearchPolicy.php` |
| SEC-03 | High | Confirmed | User and log listing endpoints accept client-controlled `sort_by` values and pass them directly to `orderBy`. Even where the framework quotes identifiers, this is an unsafe query contract that can expose internal column names, cause database errors, and may become injectable if query construction changes. | `app/Repositories/UserRepository.php`, `app/Http/Controllers/Logs/LogController.php` |
| SEC-04 | Medium | Confirmed | Public search-suggestion and keyword-search endpoints have no route-level rate limit. The POST endpoint also creates a database log record for every request, enabling low-cost database/logging abuse. | `routes/web.php`, `app/Http/Controllers/ResearchSearchController.php` |
| SEC-05 | Medium | Confirmed | File validation checks extension/MIME rules and size, but there is no malware-scanning workflow, no file-content inspection, and private documents are stored publicly. | `app/Http/Requests/StoreResearchRequest.php`, `app/Http/Requests/UpdateResearchRequest.php`, file services |
| SEC-06 | Medium | Confirmed | The reports matrix controller logs the complete request payload. Query strings may contain user-supplied data and should not be broadly copied into operational logs. | `app/Http/Controllers/ResearchMatrixController.php` |
| SEC-07 | Medium | Confirmed | No application security-header middleware is configured for CSP, clickjacking protection, MIME-sniffing protection, referrer policy, or permissions policy. | `bootstrap/app.php` |
| SEC-08 | Medium | Deployment verification required | Session cookies are HTTP-only and SameSite=Lax by default, but production `SESSION_SECURE_COOKIE=true` is not enforced by repository configuration. Session encryption is also disabled by default. | `config/session.php`, `.env.example` |
| SEC-09 | Medium | Deployment verification required | HTTPS enforcement, HSTS, trusted-proxy configuration, web-server directory permissions, database least privilege, backup protection, production `APP_DEBUG=false`, secret rotation, and dependency vulnerabilities cannot be confirmed from source alone. | Deployment environment and CI/CD configuration |

## Existing controls that were found

- Model-level hiding and browser response allow-lists were added in the sensitive-data remediation.
- Research detail, download, and workflow actions generally use policies.
- Login attempts have a five-attempt rate limiter.
- Form requests validate most create/update inputs.
- Session IDs and CSRF tokens are regenerated after authentication-sensitive actions.

These are useful controls, but they do not resolve the findings above.

## Implementation plan

### Phase 0 — Containment (before the next production release)

1. Confirm whether `public/storage` is enabled in production.
2. If enabled, treat all current research and report paths as potentially directly accessible.
3. Temporarily restrict public access to the storage symlink at the web-server level if it is used for private research documents.
4. Review access logs for direct `/storage/research/...` and report-file requests.
5. Keep current download endpoints as the only intended method for private files.

**Acceptance criterion:** An unauthenticated browser requesting a known manuscript, approval-sheet, draft, or generated-report storage URL receives `403` or `404`.

### Phase 1 — Private file storage and authorized downloads (SEC-01, SEC-05)

1. Create a dedicated private disk rooted outside the web root, for example `storage/app/private/research`.
2. Store manuscripts, approval sheets, drafts, and generated reports only on that private disk.
3. Update upload, replace, delete, export, and download services to use the private disk consistently.
4. Do not return raw paths or public URLs. Continue to serve files only through controller endpoints after policy/grant checks.
5. Write a migration/command to move existing files safely, update database paths, and record failures without leaking paths to users.
6. Add malware scanning or a quarantine workflow appropriate to the deployment environment before marking uploaded documents available.
7. Add tests for unauthenticated, unauthorized, authorized, expired grant, and revoked grant downloads.

**Acceptance criterion:** Private files cannot be fetched from `/storage/...`; authorized controller downloads still work; unauthorized attempts return `403`.

### Phase 2 — Enforce report and matrix authorization (SEC-02)

1. In `ReportGenerationController`, call `$this->authorize('generateReport', Research::class)` for the page and both export methods.
2. In `ResearchMatrixController`, call `$this->authorize('viewStatistics', Research::class)` before querying data.
3. Return only the fields needed by each report page; do not return raw Research or Researcher models.
4. Add tests proving students and ordinary faculty receive `403`, while administrators and MCIIS staff receive the allowed result.

**Acceptance criterion:** No role outside Administrator/MCIIS Staff can access report pages, exports, or raw reporting data.

### Phase 3 — Query and request hardening (SEC-03, SEC-04, SEC-06)

1. Define per-endpoint allow-lists for sortable fields and directions. Reject or fall back safely for unknown values.
2. Cap `per_page` values server-side for every paginator.
3. Add named route rate limiters for public search suggestions, keyword suggestions, keyword-search logging, title checks, email/ID uniqueness checks, and file-request actions.
4. Rate-limit by IP plus authenticated user ID where present; return `429` with a clear retry message.
5. Remove `request()->all()` from logs. Log only a small approved set of operational fields, and never log credentials, tokens, or arbitrary query strings.
6. Add automated tests for invalid sort fields, excessive page size, and rate-limit behavior.

**Acceptance criterion:** Unsupported sort fields never reach SQL; repeated public endpoint calls are throttled; request payloads are not copied wholesale to logs.

### Phase 4 — Browser and session hardening (SEC-07, SEC-08)

1. Add a security-header middleware and configure:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`
   - a restrictive `Referrer-Policy`
   - a restrictive `Permissions-Policy`
   - a Content Security Policy tested with the Vite/Inertia application.
2. Enforce HTTPS at the load balancer/web server and enable HSTS only after HTTPS is verified everywhere.
3. Set production environment values: `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, `SESSION_HTTP_ONLY=true`, `SESSION_SAME_SITE=lax` (or stricter if compatible), and a non-default `APP_KEY` held in secret storage.
4. Decide whether database session encryption is required for your privacy and threat model; enable it only after testing existing session behavior.
5. Configure trusted proxies correctly when the application runs behind a load balancer so HTTPS detection cannot be spoofed.

**Acceptance criterion:** Production response headers meet the agreed policy and cookies are marked `Secure; HttpOnly; SameSite=Lax` or stricter.

### Phase 5 — Deployment and operational verification (SEC-09)

1. Run `composer audit` and `npm audit` in CI and establish an update/exception process.
2. Scan Git history and the deployment platform for exposed `.env` files, credentials, OAuth secrets, database passwords, and mail tokens. Rotate any exposed secrets.
3. Confirm the database account has only required privileges and cannot administer the database server.
4. Encrypt backups, restrict access, document retention, and test restoration.
5. Configure application and web-server logs to avoid secrets and restrict log-reader access.
6. Run authenticated authorization tests for each role and object, including changed numeric IDs in URLs and JSON requests.
7. Perform a production security-header, TLS, cookie, file-access, and dependency scan after deployment.

**Acceptance criterion:** A release checklist records passing results for all deployment checks and identifies an owner/date for every accepted risk.

## Recommended implementation sequence

1. Phase 0 and Phase 1 — private files are the highest-risk next item.
2. Phase 2 — fix reporting authorization before more users are onboarded.
3. Phase 3 — eliminate unsafe sort contracts and abuse paths.
4. Phase 4 — deploy browser/session protections.
5. Phase 5 — make the checks repeatable in CI and releases.

## Manual checks still required

These cannot be truthfully confirmed by reading the repository:

- Production HTTPS certificate, redirects, and HSTS behavior.
- Actual `Secure` cookie flag and response headers in the deployed browser.
- Whether `public/storage` exists on the production server and can serve private files.
- Database, backup, storage-bucket, queue, log, and server permissions.
- Production environment values and secret-management access.
- Vulnerability scan results using the actual locked dependencies and network advisories.

## Do not implement blindly

Private-file migration and a CSP can affect working downloads and frontend assets. Implement each phase in a branch, add tests, verify it in a staging environment, and deploy with a rollback plan.
