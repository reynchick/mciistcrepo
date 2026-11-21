# Current Account Access and Audit Log Flow

## Student accounts

- An Administrator must create or import a student account before the student can sign in.
- Google SSO authenticates an existing account; it does not create a student account.
- Student access requires administrator approval and must not be revoked.
- Students do not complete a profile during sign-in. Student records are managed through Student Management.

## Faculty accounts

- Faculty accounts are created by an Administrator or provisioned through Google SSO when a matching Faculty record exists.
- Faculty profile verification remains a separate first-login flow where required.

## Other roles

Administrator, MCIIS Staff, and Librarian accounts must be provisioned by an Administrator. Role checks use the assigned roles and the active role.

## Audit logs

- `UserAuditLog` records account creation, first login, role changes, and student access approval or revocation.
- `FacultyAuditLog` records changes to faculty records and faculty profile verification.
- Student profile-completion events are not generated because student profile completion is not part of the current account flow.

The controllers and audit-log models are the source of truth for event payloads and available contexts.
