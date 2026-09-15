<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Student
 * 
 * Represents a student record that can be approved for system access.
 * Students are linked to User accounts via email when they authenticate via Google SSO.
 * 
 * Note: This model focuses on student-specific data management.
 * The actual user account and authentication is handled by the User model.
 * Students can only log in if they are approved here and their Google email matches.
 */
class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'student_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'student_access_approved',
        'student_access_approved_at',
        'student_access_revoked_at',
    ];

    protected $casts = [
        'student_access_approved' => 'boolean',
        'student_access_approved_at' => 'datetime',
        'student_access_revoked_at' => 'datetime',
    ];

    /**
     * Scope to only active (approved and not revoked) students.
     */
    public function scopeActive($query)
    {
        return $query
            ->where('student_access_approved', true)
            ->whereNull('student_access_revoked_at')
            ->whereNull('deleted_at');
    }

    /**
     * Scope to only approved students (regardless of revocation status).
     */
    public function scopeApproved($query)
    {
        return $query->where('student_access_approved', true)->whereNull('deleted_at');
    }

    /**
     * Scope to only unapproved students.
     */
    public function scopeUnapproved($query)
    {
        return $query->where('student_access_approved', false)->whereNull('deleted_at');
    }

    /**
     * Scope to only revoked (deactivated) students.
     */
    public function scopeRevoked($query)
    {
        return $query->whereNotNull('student_access_revoked_at')->whereNull('deleted_at');
    }

    /**
     * Get the linked user account for this student.
     * Matches on email since that's the identifier used during SSO.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    /**
     * Check if this student has an active user account with the Student role.
     */
    public function hasActiveUserAccount(): bool
    {
        return User::where('email', $this->email)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'Student');
            })
            ->where('deleted_at', null)
            ->exists();
    }

    /**
     * Check if student is currently active (approved and not revoked).
     */
    public function isActive(): bool
    {
        return $this->student_access_approved && !$this->student_access_revoked_at;
    }

    /**
     * Approve student access.
     */
    public function approveAccess(): void
    {
        $this->update([
            'student_access_approved' => true,
            'student_access_approved_at' => now(),
            'student_access_revoked_at' => null, // Clear revocation if re-approving
        ]);
    }

    /**
     * Revoke/deactivate student access.
     */
    public function revokeAccess(): void
    {
        $this->update([
            'student_access_revoked_at' => now(),
        ]);
    }

    /**
     * Restore revoked access without changing approval date.
     */
    public function restoreAccess(): void
    {
        $this->update([
            'student_access_revoked_at' => null,
        ]);
    }
}
