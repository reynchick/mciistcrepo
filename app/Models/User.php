<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasFullName;
use App\Traits\HasSearchable;
use App\Traits\NormalizesEmail;
use App\Traits\User\HasRoleChecks;
use App\Traits\User\HasFormatters;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory,
        Notifiable,
        HasFullName,
        HasSearchable,
        NormalizesEmail,
        HasRoleChecks,
        HasFormatters,
        SoftDeletes;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'student_id',
        'faculty_id',
        'contact_number',
        'faculty_profile_completed',
        'student_profile_completed',
        'first_login_completed',
        'email_verified_at',
        'remember_token',
        'created_by_admin',
        'google_id',
        'avatar',
    ];

    protected $casts = [
        'faculty_profile_completed' => 'boolean',
        'student_profile_completed' => 'boolean',
        'first_login_completed' => 'boolean',
        'created_by_admin' => 'boolean',
    ];

    public function userAuditLogs(): HasMany
    {
        return $this->hasMany(UserAuditLog::class, 'modified_by');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')->withTimestamps();
    }

    /**
     * Get the audit logs targeting this user account.
     */
    public function userAuditLogsTargeting(): HasMany
    {
        return $this->hasMany(UserAuditLog::class, 'target_user_id');
    }

    /**
     * Get the faculty audit logs where this user performed the modification.
     */
    public function facultyAuditLogs(): HasMany
    {
        return $this->hasMany(FacultyAuditLog::class, 'modified_by');
    }

    /**
     * Get the faculty record associated with this user.
     * 
     * Note: Both user.faculty_id and Faculty.faculty_id are strings (e.g., "F001", "F002")
     * We match on the faculty_id string column, not the id primary key
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'faculty_id', 'faculty_id');
    }

    /**
     * Check if user has a specific role (supports multiple roles)
     */
    public function hasRole(string $role): bool
    {
        $requestedRole = $this->normalizeRoleName($role);
        if ($requestedRole === null) {
            return false;
        }

        $activeRole = $this->normalizeRoleName($this->getActiveRoleName());
        if ($activeRole !== null && $activeRole === $requestedRole) {
            return true;
        }

        return $this->roles()->where('name', $requestedRole)->exists();
    }

    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole(array $roles): bool
    {
        $normalizedRoles = array_values(array_filter(array_map(fn ($role) => $this->normalizeRoleName($role), $roles)));
        if ($normalizedRoles === []) {
            return false;
        }

        $activeRole = $this->normalizeRoleName($this->getActiveRoleName());
        if ($activeRole !== null && in_array($activeRole, $normalizedRoles, true)) {
            return true;
        }

        return $this->roles()->whereIn('name', $normalizedRoles)->exists();
    }

    /**
     * Check if the user is a student.
     */
    public function isStudent(): bool
    {
        return $this->hasRole('Student');
    }

    /**
     * Check if the user is an administrator.
     */
    public function isAdministrator(): bool
    {
        return $this->hasRole('Administrator');
    }

    /**
     * Check if the user is faculty.
     */
    public function isFaculty(): bool
    {
        return $this->hasRole('Faculty');
    }

    /**
     * Check if the user is MCIIS staff.
     */
    public function isMCIISStaff(): bool
    {
        return $this->hasRole('MCIIS Staff');
    }

    /**
     * Check if user is admin or staff
     */
    public function isAdminOrStaff(): bool
    {
        return $this->isAdministrator() || $this->isMCIISStaff();
    }

    protected function getActiveRoleName(): ?string
    {
        $activeRole = session('active_role');

        if (is_string($activeRole) && trim($activeRole) !== '') {
            return trim($activeRole);
        }

        return null;
    }

    protected function normalizeRoleName(?string $role): ?string
    {
        $name = trim((string) $role);
        if ($name === '') {
            return null;
        }

        return match (mb_strtolower($name)) {
            'administrator', 'admin' => 'Administrator',
            'mciis staff', 'mciis_staff', 'staff' => 'MCIIS Staff',
            'faculty' => 'Faculty',
            'student' => 'Student',
            default => $name,
        };
    }

    public function needsFacultyProfileCompletion(): bool
    {
        return $this->isFaculty() && !$this->isProfileCompletedForRole('faculty');
    }

    public function needsStudentProfileCompletion(): bool
    {
        return $this->isStudent() && !$this->isProfileCompletedForRole('student');
    }

    protected function isProfileCompletedForRole(string $role): bool
    {
        $value = $role === 'faculty'
            ? $this->faculty_profile_completed
            : $this->student_profile_completed;

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === true;
    }

    public function needsProfileCompletion(): bool
    {
        return $this->needsFacultyProfileCompletion() || $this->needsStudentProfileCompletion();
    }

    public function dashboardRoleName(): ?string
    {
        $priority = config('dashboard.role_priority', ['Administrator', 'MCIIS Staff', 'Faculty', 'Student']);

        foreach ($priority as $roleName) {
            if ($this->hasRole($roleName)) {
                return $roleName;
            }
        }

        return null;
    }

    public function dashboardRoute(): string
    {
        return match ($this->dashboardRoleName()) {
            'Administrator' => 'dashboard',
            'MCIIS Staff' => 'staff.dashboard',
            'Faculty' => 'faculty.dashboard',
            'Student' => 'student.dashboard',
            default => 'browse',
        };
    }

    public function profileCompletionRedirectRoute(): string
    {
        return 'browse';
    }
    
    /**
     * Snapshot of user identity for audit trails.
     */
    public function auditSnapshot(): array
    {
        return [
            'id' => $this->id,
            'name' => trim(implode(' ', array_filter([$this->first_name, $this->middle_name, $this->last_name]))),
            'email' => $this->email,
            'roles' => $this->roles()->pluck('name')->values()->all(),
        ];
    }

    /**
     * Count active administrators (excludes soft-deleted accounts).
     */
    public static function administratorCount(): int
    {
        return static::whereHas('roles', fn($q) => $q->where('name', 'Administrator'))->count();
    }

    /**
     * Format contact number for display
     */
    public function getFormattedContactNumberAttribute(): ?string
    {
        if (!$this->contact_number) {
            return null;
        }

        $clean = preg_replace('/[^0-9]/', '', $this->contact_number);
        
        if (strlen($clean) === 11 && substr($clean, 0, 2) === '09') {
            return '+63 ' . substr($clean, 1);
        }
        
        if (strlen($clean) === 12 && substr($clean, 0, 2) === '63') {
            return '+63 ' . substr($clean, 2);
        }
        
        return $this->contact_number;
    }

    /**
     * Format student ID for display
     */
    public function getFormattedStudentIdAttribute(): ?string
    {
        if (!$this->student_id) {
            return null;
        }

        $clean = preg_replace('/[^0-9]/', '', $this->student_id);
        
        if (strlen($clean) >= 8) {
            $year = substr($clean, 0, 4);
            $number = substr($clean, 4);
            return $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
        }
        
        return $this->student_id;
    }
}
