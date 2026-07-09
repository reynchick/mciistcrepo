<?php

namespace App\Observers;

use App\Models\User;
use App\Models\UserAuditLog;
use Illuminate\Support\Facades\Auth;

class UserObserver
{
    /**
     * Temporary metadata storage for custom context.
     * Controllers can set this before creating/updating users.
     */
    public static ?array $customMetadata = null;

    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        if (!$this->shouldLog()) {
            self::$customMetadata = null;
            return;
        }
        
        // Extract and structure metadata
        $metadata = $this->structureMetadata(self::$customMetadata ?? [], 'created');

        $this->logUserAudit(
            $user,
            UserAuditLog::ACTION_CREATE,
            null,
            $user->getAttributes(),
            $metadata
        );

        // Clear custom metadata after use
        self::$customMetadata = null;
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        if (!$this->shouldLog()) {
            self::$customMetadata = null;
            return;
        }
        $changes = $user->getChanges();

        // Figure out which fields actually changed
        $changedKeys = array_keys($changes);

        // Fields we consider "noise" (framework / technical)
        $ignored = ['remember_token', 'updated_at'];

        // Keep only meaningful fields
        $meaningfulChanged = array_diff($changedKeys, $ignored);

        // If nothing meaningful changed, do NOT create an audit log
        if (empty($meaningfulChanged)) {
            // Clear custom metadata just in case
            self::$customMetadata = null;
            return;
        }

        // Extract and structure metadata
        $metadata = $this->structureMetadata(
            array_merge(
                self::$customMetadata ?? [],
                ['changed' => $meaningfulChanged]
            ),
            'updated'
        );

        $this->logUserAudit(
            $user,
            UserAuditLog::ACTION_UPDATE,
            $user->getOriginal(),
            $changes,
            $metadata
        );

        self::$customMetadata = null;
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        if (!$this->shouldLog()) {
            return;
        }
        $this->logUserAudit(
            $user,
            UserAuditLog::ACTION_DEACTIVATE,
            $user->getOriginal(),
            null,
            ['event' => 'deleted']
        );
    }

    /**
     * Create a UserAuditLog entry.
     */
    protected function logUserAudit(
        User $user,
        string $action,
        ?array $oldValues,
        ?array $newValues,
        array $metadata = []
    ): void {
        $baseSnapshots = [
            'actor_snapshot' => $this->actorSnapshot(),
            'target_snapshot' => $user->auditSnapshot(),
        ];

        UserAuditLog::create(array_merge($this->requestContext($user), [
            'target_user_id' => $user->id,
            'action_type' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => array_merge($baseSnapshots, $metadata),
        ]));
    }

    /**
     * Common context pulled from the current request/auth.
     */
    protected function requestContext(User $user = null): array
    {
        return [
            // Use Auth::id() if available, otherwise use the user's own ID (self-modification during registration/login)
            'modified_by' => Auth::id() ?? $user?->id,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ];
    }

    protected function actorSnapshot(): ?array
    {
        $actor = Auth::user();
        return $actor?->auditSnapshot();
    }

    protected function shouldLog(): bool
    {
        // Avoid logging during seeding/CLI where no HTTP request exists
        return !app()->runningInConsole() && request() !== null;
    }

    /**
     * Structure metadata with source and context extracted from action string.
     * Maps old 'action' key to 'source' and 'context' constants.
     * Also accepts source/context keys directly (new format).
     */
    private function structureMetadata(array $customMetadata, string $event): array
    {
        $structured = [
            'source' => null,
            'context' => null,
        ];

        // If source/context are already provided (new format), use them directly
        if (isset($customMetadata['source'])) {
            $structured['source'] = $customMetadata['source'];
        }
        if (isset($customMetadata['context'])) {
            $structured['context'] = $customMetadata['context'];
        }

        // Backward compatibility: Extract source/context from 'action' key if not already set
        if (isset($customMetadata['action']) && !isset($customMetadata['source'])) {
            $action = $customMetadata['action'];
            
            // Map source
            if (str_contains($action, 'google_sso')) {
                $structured['source'] = UserAuditLog::SOURCE_GOOGLE_SSO;
            } elseif (str_contains($action, 'admin_created') || $action === 'first_google_login') {
                // 'first_google_login' means admin-created account on first login
                $structured['source'] = UserAuditLog::SOURCE_ADMIN_CREATED;
            }
        }
        
        if (isset($customMetadata['action']) && !isset($customMetadata['context'])) {
            $action = $customMetadata['action'];
            
            // Map context
            if (str_contains($action, 'registration')) {
                $structured['context'] = UserAuditLog::CONTEXT_USER_REGISTRATION;
            } elseif (str_contains($action, 'first_login')) {
                $structured['context'] = UserAuditLog::CONTEXT_FIRST_LOGIN;
            } elseif (str_contains($action, 'profile_completion')) {
                $structured['context'] = UserAuditLog::CONTEXT_PROFILE_COMPLETION;
            }
        }

        // Preserve note and other custom fields
        if (isset($customMetadata['note'])) {
            $structured['note'] = $customMetadata['note'];
        }
        if (isset($customMetadata['google_id'])) {
            $structured['google_id'] = $customMetadata['google_id'];
        }

        // Keep other metadata fields (excluding ones we've already handled)
        foreach ($customMetadata as $key => $value) {
            if (!in_array($key, ['action', 'source', 'context', 'note', 'google_id'])) {
                $structured[$key] = $value;
            }
        }

        return $structured;
    }
}