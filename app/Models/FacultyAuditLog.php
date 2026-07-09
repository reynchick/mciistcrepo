<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacultyAuditLog extends Model
{
    use HasFactory;
    
    // Action types
    public const ACTION_CREATE = 'create_faculty';
    public const ACTION_UPDATE = 'update_faculty';
    public const ACTION_DELETE = 'delete_faculty';
    
    // Context (what triggered the action)
    public const CONTEXT_PROFILE_COMPLETION = 'profile_completion';
    public const CONTEXT_PROFILE_UPDATE = 'profile_update';
    public const CONTEXT_ADMIN_UPDATE = 'admin_update';
    public const CONTEXT_FACULTY_IMPORT = 'faculty_import';
    public const CONTEXT_SEED_INITIALIZATION = 'seed_initialization';
    
    protected $fillable = [
        'modified_by',
        'target_faculty_id',
        'action_type',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user who performed the modification.
     */
    public function modifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modified_by');
    }

    /**
     * Alias for modifiedBy - for consistency with frontend expectations.
     */
    public function modifiedByUser(): BelongsTo
    {
        return $this->modifiedBy();
    }

    /**
     * Get the faculty record that was modified.
     */
    public function targetFaculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'target_faculty_id');
    }

    public static function getActionTypes(): array
    {
        return [
            self::ACTION_CREATE => 'Create Faculty',
            self::ACTION_UPDATE => 'Update Faculty',
            self::ACTION_DELETE => 'Delete Faculty',
        ];
    }
}