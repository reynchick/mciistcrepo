# Complete Account Flow with Audit Log Structure

## I. Roles & Global Rules

### Roles
- Faculty
- Student
- Administrator
- MCIIS Staff

### Global Rules

1. **Faculty & Student**
   - Must complete profile before system access
   - Can be created via Google SSO or Administrator

2. **Administrator & MCIIS Staff**
   - Must be pre-created by an Administrator
   - No profile completion required

3. **Account creation method does NOT affect access control**

4. **Only ONE email is ever sent per user**

5. **Email is sent ONLY when an account is created by an Administrator**

---

## II. Email Policy (One Email Only)

### Account Created Email

**Subject:** "Your account has been created"

- Sent once only
- Sent only for admin-created accounts
- **Purpose:**
  - Account invitation
  - Login instructions
- No other emails are sent at any point
- Google SSO users receive no emails from the system

---

## III. Audit Log Structures

### UserAuditLog Structure

**Purpose:** Tracks user account lifecycle (creation, authentication, updates)

#### Metadata Fields

```json
{
  "source": "google_sso|admin_created|seed_initialization",
  "context": "user_registration|first_login|profile_completion|role_change",
  "note": "Human-readable description",
  "google_id": "..." // Optional extra fields
}
```

#### Source Values (HOW account was CREATED - immutable)

| Source | Constant | Meaning |
|--------|----------|---------|
| `google_sso` | `UserAuditLog::SOURCE_GOOGLE_SSO` | User self-registered via Google SSO |
| `admin_created` | `UserAuditLog::SOURCE_ADMIN_CREATED` | Administrator created the account |
| `seed_initialization` | `UserAuditLog::SOURCE_SEED_INITIALIZATION` | Account created via database seeder |

#### Context Values (WHAT action is happening - mutable)

| Context | Constant | When Used |
|---------|----------|-----------|
| `user_registration` | `UserAuditLog::CONTEXT_USER_REGISTRATION` | Initial account creation |
| `first_login` | `UserAuditLog::CONTEXT_FIRST_LOGIN` | User's first authentication |
| `profile_completion` | `UserAuditLog::CONTEXT_PROFILE_COMPLETION` | User completed profile |
| `role_change` | `UserAuditLog::CONTEXT_ROLE_CHANGE` | User's roles were modified |

### FacultyAuditLog Structure

**Purpose:** Tracks faculty profile updates (research interests, education, etc.)

#### Metadata Fields

```json
{
  "context": "profile_completion|profile_update|faculty_import",
  "note": "Human-readable description"
}
```

**Note:** FacultyAuditLog does NOT use `source`. Use `modified_by` field to determine who made the change:
- `modified_by == target_user_id` → User updated their own profile
- `modified_by != target_user_id` → Admin updated it

#### Context Values (WHAT action is happening)

| Context | Constant | When Used |
|---------|----------|-----------|
| `profile_completion` | `FacultyAuditLog::CONTEXT_PROFILE_COMPLETION` | Faculty completing profile first time |
| `profile_update` | `FacultyAuditLog::CONTEXT_PROFILE_UPDATE` | Subsequent profile updates |
| `faculty_import` | `FacultyAuditLog::CONTEXT_FACULTY_IMPORT` | Bulk import/seed operation |

---

## IV. Account Flows with Complete Audit Logs

### 1️⃣ Google SSO Flow (Faculty / Student ONLY)

#### First Google Login

**Steps:**
1. User logs in via Google SSO
2. System determines role:
   - Email exists in Faculty table → Faculty
   - Else → Student
3. User record is created:
   - `profile_completed = false`
   - `first_login_completed = true`
   - `email_verified_at = now()` (trusted via Google)
   - `created_by_admin = false`
4. User is redirected to profile completion page
5. ❌ System access is blocked

**Audit Logs:**

| Log Type | Action | Metadata |
|----------|--------|----------|
| UserAuditLog | create_user | `{ "source": "google_sso", "context": "user_registration", "note": "User registered via Google SSO", "google_id": "..." }` |

**Controller Code:**

```php
UserObserver::$customMetadata = [
    'source' => UserAuditLog::SOURCE_GOOGLE_SSO,
    'context' => UserAuditLog::CONTEXT_USER_REGISTRATION,
    'note' => 'User registered via Google SSO',
    'google_id' => $googleUser->getId(),
];

$user = User::create([
    // ... fields
    'created_by_admin' => false,
]);
```

#### Profile Completion

**Steps:**
1. User completes required profile
2. System updates:
   - `profile_completed = true`
   - For Faculty: Updates faculty table (research_interest, etc.)
3. ✅ Full system access is granted
4. 📧 No email sent

**Audit Logs:**

| Log Type | Action | Metadata |
|----------|--------|----------|
| UserAuditLog | update_user | `{ "source": "google_sso", "context": "profile_completion", "note": "Profile completed" }` |
| FacultyAuditLog (Faculty only) | update_faculty | `{ "context": "profile_completion", "note": "Profile completed" }` |

**Controller Code:**

```php
// CompleteStudentProfileController or CompleteFacultyProfileController
UserObserver::$customMetadata = [
    'source' => UserAuditLog::SOURCE_GOOGLE_SSO,
    'context' => UserAuditLog::CONTEXT_PROFILE_COMPLETION,
    'note' => 'Profile completed',
];

$user->update(['profile_completed' => true, /* ... */]);

// For Faculty only:
FacultyObserver::$customMetadata = [
    'context' => FacultyAuditLog::CONTEXT_PROFILE_COMPLETION,
    'note' => 'Faculty completed profile',
];

$faculty->update([/* research_interest, etc. */]);
```

---

### 2️⃣ Admin-Created Faculty / Student Flow

#### Account Creation

**Steps:**
1. Administrator creates account
2. Role: Faculty or Student
3. System sets:
   - `profile_completed = false`
   - `first_login_completed = false`
   - `email_verified_at = null`
   - `created_by_admin = true`
4. 📧 Email sent: "Your account has been created. Please login to complete profile"
5. ❌ No system access yet

**Audit Logs:**

| Log Type | Action | Metadata |
|----------|--------|----------|
| UserAuditLog | create_user | `{ "source": "admin_created", "context": "user_registration", "note": "Account created" }` |

**Controller Code:**

```php
// UserController::store()
UserObserver::$customMetadata = [
    'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
    'context' => UserAuditLog::CONTEXT_USER_REGISTRATION,
    'note' => 'Account created',
];

$user = User::create([
    // ... fields
    'created_by_admin' => true,
    'profile_completed' => false,
    'first_login_completed' => false,
]);

// Send email only for Faculty/Student
if ($user->hasRole(['Faculty', 'Student'])) {
    Mail::queue(new AccountCreatedMail($user));
}
```

#### First Login

**Steps:**
1. User logs in via Google SSO
2. System updates:
   - `google_id = ...` (if Google SSO)
   - `first_login_completed = true`
   - `email_verified_at = now()`
3. User is redirected to profile completion page
4. ❌ System access is blocked
5. 📧 No email sent

**Audit Logs:**

| Log Type | Action | Metadata |
|----------|--------|----------|
| UserAuditLog | update_user | `{ "source": "admin_created", "context": "first_login", "note": "Logged in via Google SSO" }` |

**Controller Code:**

```php
// GoogleAuthController::callback() - existing user
$source = $user->created_by_admin
    ? UserAuditLog::SOURCE_ADMIN_CREATED
    : UserAuditLog::SOURCE_GOOGLE_SSO;

UserObserver::$customMetadata = [
    'source' => $source,
    'context' => UserAuditLog::CONTEXT_FIRST_LOGIN,
    'note' => 'Logged in via Google SSO',
];

$user->update([
    'google_id' => $googleUser->getId(),
    'first_login_completed' => true,
    'email_verified_at' => now(),
]);
```

#### Profile Completion

**Steps:**
1. User completes profile
2. System updates:
   - `profile_completed = true`
   - For Faculty: Updates faculty table
3. ✅ Full system access is granted
4. 📧 No email sent

**Audit Logs:**

| Log Type | Action | Metadata |
|----------|--------|----------|
| UserAuditLog | update_user | `{ "source": "admin_created", "context": "profile_completion", "note": "Profile completed" }` |
| FacultyAuditLog (Faculty only) | update_faculty | `{ "context": "profile_completion", "note": "Profile completed" }` |

**Controller Code:**

```php
$source = $user->created_by_admin
    ? UserAuditLog::SOURCE_ADMIN_CREATED
    : UserAuditLog::SOURCE_GOOGLE_SSO;

UserObserver::$customMetadata = [
    'source' => $source,
    'context' => UserAuditLog::CONTEXT_PROFILE_COMPLETION,
    'note' => 'Profile completed',
];

$user->update(['profile_completed' => true, /* ... */]);

// For Faculty only:
FacultyObserver::$customMetadata = [
    'context' => FacultyAuditLog::CONTEXT_PROFILE_COMPLETION,
    'note' => 'Faculty completed profile',
];

$faculty->update([/* ... */]);
```

---

### 3️⃣ Administrator / MCIIS Staff Flow

#### Account Creation

**Steps:**
1. Existing Administrator creates account
2. Role: Administrator or MCIIS Staff
3. System sets:
   - `profile_completed = true` (no profile completion needed)
   - `first_login_completed = false`
   - `email_verified_at = null`
   - `created_by_admin = true`
4. 📧 Email sent: "Your account has been created"

**Audit Logs:**

| Log Type | Action | Metadata |
|----------|--------|----------|
| UserAuditLog | create_user | `{ "source": "admin_created", "context": "user_registration", "note": "Account created" }` |

**Controller Code:**

```php
// UserController::store()
UserObserver::$customMetadata = [
    'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
    'context' => UserAuditLog::CONTEXT_USER_REGISTRATION,
    'note' => 'Administrator created admin/staff account',
];

$user = User::create([
    // ... fields
    'created_by_admin' => true,
    'profile_completed' => true, // No profile completion needed
    'first_login_completed' => false,
]);

// Always send email for Admin/Staff
Mail::queue(new AccountCreatedMail($user));
```

#### First Login

**Steps:**
1. User logs in via Google SSO
2. System updates:
   - `google_id = ...` (if Google SSO)
   - `first_login_completed = true`
   - `email_verified_at = now()`
3. ✅ Immediate system access (no profile completion needed)
4. 📧 No email sent

**Audit Logs:**

| Log Type | Action | Metadata |
|----------|--------|----------|
| UserAuditLog | update_user | `{ "source": "admin_created", "context": "first_login", "note": "Logged in via Google SSO" }` |

**Controller Code:**

```php
// GoogleAuthController::callback() - existing user
$source = $user->created_by_admin
    ? UserAuditLog::SOURCE_ADMIN_CREATED
    : UserAuditLog::SOURCE_GOOGLE_SSO;

UserObserver::$customMetadata = [
    'source' => $source,
    'context' => UserAuditLog::CONTEXT_FIRST_LOGIN,
    'note' => 'Admin/Staff logged in via Google SSO',
];

$user->update([
    'google_id' => $googleUser->getId(),
    'first_login_completed' => true,
    'email_verified_at' => now(),
]);

// Redirect to browse (no profile completion)
return redirect()->route('browse');
```

---

## V. Access Control (Middleware)

```php
// EnsureProfileCompleted Middleware
if (in_array($user->role, ['Faculty', 'Student']) && !$user->profile_completed) {
    // Redirect to profile completion page
    return redirect()->route('profile.complete');
}

// Creation source does not matter - both Google SSO and admin-created follow same rule
```

---

## VI. Database Schema Additions

### users table

```php
$table->boolean('created_by_admin')->default(false)
    ->comment('Whether account was created by administrator (true) or via Google SSO (false)');
```

**Usage:**
- Determines `source` in UserAuditLog metadata
- Query: `User::where('created_by_admin', true)->get()` (all admin-created accounts)

---

## VII. Query Examples

### Find all Google SSO registrations

```sql
SELECT * FROM user_audit_logs 
WHERE action_type = 'create_user'
  AND JSON_EXTRACT(metadata, '$.source') = 'google_sso';
```

### Find all profile completions

```sql
SELECT * FROM user_audit_logs 
WHERE action_type = 'update_user'
  AND JSON_EXTRACT(metadata, '$.context') = 'profile_completion';
```

### Find faculty who completed their own profile

```sql
SELECT * FROM faculty_audit_logs 
WHERE action_type = 'update_faculty'
  AND JSON_EXTRACT(metadata, '$.context') = 'profile_completion'
  AND modified_by = target_user_id;
```

### Find admin-modified faculty records

```sql
SELECT * FROM faculty_audit_logs 
WHERE modified_by != target_user_id;
```

---

## VIII. Summary of Key Differences

| Aspect | UserAuditLog | FacultyAuditLog |
|--------|-------------|-----------------|
| **Purpose** | User account lifecycle | Faculty profile updates |
| **Source field** | ✅ Yes (how account created) | ❌ No (use modified_by) |
| **Context field** | ✅ Yes (lifecycle phase) | ✅ Yes (action type) |
| **Create action** | ✅ Yes (account creation) | ❌ Rarely (only during import) |
| **Update action** | ✅ Yes (login, profile) | ✅ Yes (profile changes) |
| **Who did it** | Check modified_by | Check modified_by |

---

## IX. Implementation Checklist

### Phase 1: Audit Infrastructure ✅
- ✅ UserAuditLog constants (SOURCE_, CONTEXT_)
- ✅ FacultyAuditLog constants (CONTEXT_* only)
- ✅ UserObserver structureMetadata() method
- ✅ FacultyObserver structureMetadata() method
- ✅ Migration: created_by_admin column

### Phase 2: Email Implementation 🔄
- ☐ Create AccountCreatedMail class
- ☐ Update UserController::store() to send emails
- ☐ Set metadata for admin account creation

### Phase 3: First Login Tracking ⏳
- ☐ GoogleAuthController already handles this (verify)
- ☐ AuthenticatedSessionController for non-Google logins

### Phase 4: Profile Completion ⏳
- ☐ CompleteStudentProfileController metadata
- ☐ CompleteFacultyProfileController metadata

### Phase 5: Middleware ⏳
- ☐ EnsureProfileCompleted - verify logic

### Phase 6: Testing ⏳
- ☐ Test all three flows
- ☐ Verify audit logs
- ☐ Verify email sending
