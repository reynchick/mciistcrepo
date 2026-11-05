<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchEntryLog extends Model
{
    use HasFactory;
    public const ACTION_CREATE = 'create_research_entry';
    public const ACTION_UPDATE = 'update_research_entry';
    public const ACTION_SUBMIT_FOR_REVIEW = 'submit_research_entry';
    public const ACTION_RETURN = 'return_research_entry';
    public const ACTION_RETURN_FOR_REVISION = 'return_research_entry';
    public const ACTION_POST = 'post_research_entry';
    public const ACTION_ARCHIVE = 'archive_research_entry';
    public const ACTION_RESTORE = 'restore_research_entry';
    public const ACTION_INVITE_RESEARCHERS = 'invite_researchers';
    public const ACTION_REASSIGN_ADVISER = 'reassign_research_adviser';
    public const ACTION_MARK_LEGACY_UNAVAILABLE = 'mark_legacy_unavailable';
    public const ACTION_REQUEST_ADVISER_METADATA = 'request_adviser_metadata';
    public const ACTION_HARD_DELETE = 'hard_delete_research_entry';
    public const ACTION_CHANGE_STATUS = 'change_status_research_entry';
    public const ACTION_NOTIFICATION_FAILED = 'research_notification_failed';

    protected $fillable = [
        'modified_by',
        'target_research_id',
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
     * Preserve the identity used when an audit record is written.  Roles may
     * change later, so the activity timeline can continue to describe the
     * action as it was performed.
     */
    protected static function booted(): void
    {
        static::creating(function (self $log): void {
            if (! $log->modified_by) {
                return;
            }

            $metadata = $log->metadata ?? [];
            if (filled(data_get($metadata, 'actor_snapshot.name'))
                && array_key_exists('role', data_get($metadata, 'actor_snapshot', []))) {
                return;
            }

            $actor = User::query()->with('roles:id,name')->find($log->modified_by);
            if (! $actor) {
                return;
            }

            $metadata['actor_snapshot'] = [
                'id' => $actor->id,
                'name' => $actor->full_name,
                'role' => self::actorRoleLabel(self::activeRoleForActor($actor)),
            ];

            $log->metadata = $metadata;
        });
    }

    /** Convert internal role names to the concise audit-card labels. */
    public static function actorRoleLabel(?string $role): ?string
    {
        return match ($role) {
            'MCIIS Staff' => 'Staff',
            'Administrator' => 'Admin',
            default => $role,
        };
    }

    private static function activeRoleForActor(User $actor): ?string
    {
        $activeRole = trim((string) session('active_role', ''));
        $normalizedActiveRole = match (mb_strtolower($activeRole)) {
            'administrator', 'admin' => 'Administrator',
            'mciis staff', 'mciis_staff', 'staff' => 'MCIIS Staff',
            'faculty' => 'Faculty',
            'student' => 'Student',
            default => null,
        };

        if ($normalizedActiveRole !== null && $actor->roles->contains('name', $normalizedActiveRole)) {
            return $normalizedActiveRole;
        }

        return $actor->roles->count() === 1 ? $actor->roles->first()?->name : null;
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
     * Get the research record that was modified.
     */
    public function targetResearch(): BelongsTo
    {
        return $this->belongsTo(Research::class, 'target_research_id');
    }

    public static function getActionTypes(): array
    {
        return [
            self::ACTION_CREATE => 'Create Research Entry',
            self::ACTION_UPDATE => 'Update Research Entry',
            self::ACTION_SUBMIT_FOR_REVIEW => 'Submit for Review',
            self::ACTION_RETURN => 'Return for Revision',
            self::ACTION_RETURN_FOR_REVISION => 'Return for Revision',
            self::ACTION_POST => 'Post Research Entry',
            self::ACTION_ARCHIVE => 'Archive Research Entry',
            self::ACTION_RESTORE => 'Restore Research Entry',
            self::ACTION_INVITE_RESEARCHERS => 'Invite Researchers',
            self::ACTION_REASSIGN_ADVISER => 'Reassign Adviser',
            self::ACTION_MARK_LEGACY_UNAVAILABLE => 'Mark Legacy Unavailable',
            self::ACTION_REQUEST_ADVISER_METADATA => 'Request Adviser Metadata',
            self::ACTION_HARD_DELETE => 'Hard Delete Research Entry',
            self::ACTION_NOTIFICATION_FAILED => 'Research Notification Failed',
        ];
    }
}
