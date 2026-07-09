<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAuditLog extends Model
{
    use HasFactory;
    
    // Action types
    public const ACTION_CREATE = 'create_user';
    public const ACTION_UPDATE = 'update_user';
    public const ACTION_DEACTIVATE = 'deactivate_user';
    
    // Metadata: Source (how account was created)
    public const SOURCE_ADMIN_CREATED = 'admin_created';
    public const SOURCE_GOOGLE_SSO = 'google_sso';
    public const SOURCE_SEED_INITIALIZATION = 'seed_initialization';
    
    // Metadata: Context (what triggered the action)
    public const CONTEXT_USER_REGISTRATION = 'user_registration';
    public const CONTEXT_FIRST_LOGIN = 'first_login';
    public const CONTEXT_PROFILE_COMPLETION = 'profile_completion';
    public const CONTEXT_ROLE_CHANGE = 'role_change';

    protected $fillable = [
        'modified_by',
        'target_user_id',
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
        return $this->belongsTo(User::class, 'modified_by')->withTrashed();
    }

    /**
     * Alias for modifiedBy - for consistency with frontend expectations.
     */
    public function modifiedByUser(): BelongsTo
    {
        return $this->modifiedBy();
    }

    /**
     * Get the user account that was modified.
     */
    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id')->withTrashed();
    }

    public static function getActionTypes(): array
    {
        return [
           self::ACTION_CREATE => 'Create User', 
           self::ACTION_UPDATE => 'Update User', 
           self::ACTION_DEACTIVATE => 'Deactivate User',
        ];
    }
}