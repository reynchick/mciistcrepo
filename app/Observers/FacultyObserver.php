<?php

namespace App\Observers;

use App\Models\Faculty;
use App\Models\FacultyAuditLog;
use Illuminate\Support\Facades\Auth;

class FacultyObserver
{
    /**
     * Temporary metadata storage for custom context.
     * Controllers can set this before creating/updating faculty.
     */
    public static ?array $customMetadata = null;

    /**
     * Handle the Faculty "created" event.
     */
    public function created(Faculty $faculty): void
    {
        if (!$this->shouldLog()) {
            self::$customMetadata = null;
            return;
        }
        
        // Extract and structure metadata
        $metadata = $this->structureMetadata(self::$customMetadata ?? [], 'created');

        $this->logFacultyAudit(
            $faculty,
            FacultyAuditLog::ACTION_CREATE,
            null,
            $faculty->getAttributes(),
            $metadata
        );

        // Clear custom metadata after use
        self::$customMetadata = null;
    }

    /**
     * Handle the Faculty "updated" event.
     */
    public function updated(Faculty $faculty): void
    {
        if (!$this->shouldLog()) {
            self::$customMetadata = null;
            return;
        }
        $changes = $faculty->getChanges();

        if (!empty($changes)) {
            // Extract and structure metadata
            $metadata = $this->structureMetadata(
                array_merge(
                    self::$customMetadata ?? [],
                    ['changed' => array_keys($changes)]
                ),
                'updated'
            );

            $this->logFacultyAudit(
                $faculty,
                FacultyAuditLog::ACTION_UPDATE,
                $faculty->getOriginal(),
                $changes,
                $metadata
            );

            // Clear custom metadata after use
            self::$customMetadata = null;
        }
    }

    /**
     * Handle the Faculty "deleted" event.
     */
    public function deleted(Faculty $faculty): void
    {
        if (!$this->shouldLog()) {
            return;
        }
        $this->logFacultyAudit(
            $faculty,
            FacultyAuditLog::ACTION_DELETE,
            $faculty->getOriginal(),
            null,
            ['event' => 'deleted']
        );
    }

    /**
     * Create a FacultyAuditLog entry.
     */
    protected function logFacultyAudit(
        Faculty $faculty,
        string $action,
        ?array $oldValues,
        ?array $newValues,
        array $metadata = []
    ): void {
        FacultyAuditLog::create(array_merge($this->requestContext(), [
            'target_faculty_id' => $faculty->id,
            'action_type' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
        ]));
    }

    /**
     * Common context pulled from the current request/auth.
     */
    protected function requestContext(): array
    {
        $modifiedBy = Auth::id() ?? (self::$customMetadata['modified_by'] ?? null);

        return [
            'modified_by' => $modifiedBy,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ];
    }

    protected function shouldLog(): bool
    {
        return !app()->runningInConsole() && request() !== null;
    }

    /**
     * Structure metadata with context extracted from action string.
     * Maps old 'action' key to 'context' constants.
     * Also accepts context key directly (new format).
     */
    private function structureMetadata(array $customMetadata, string $event): array
    {
        $structured = [
            'context' => null,
        ];

        // If context is already provided (new format), use it directly
        if (isset($customMetadata['context'])) {
            $structured['context'] = $customMetadata['context'];
        }

        // Backward compatibility: Extract context from 'action' key if not already set
        if (isset($customMetadata['action']) && !isset($customMetadata['context'])) {
            $action = $customMetadata['action'];
            
            // Map context
            if (str_contains($action, 'profile_completion')) {
                $structured['context'] = FacultyAuditLog::CONTEXT_PROFILE_COMPLETION;
            } elseif (str_contains($action, 'import')) {
                $structured['context'] = FacultyAuditLog::CONTEXT_FACULTY_IMPORT;
            } elseif (str_contains($action, 'admin')) {
                $structured['context'] = FacultyAuditLog::CONTEXT_ADMIN_UPDATE;
            } elseif (str_contains($action, 'seed')) {
                $structured['context'] = FacultyAuditLog::CONTEXT_SEED_INITIALIZATION;
            }
        }

        // Preserve note and other custom fields
        if (isset($customMetadata['note'])) {
            $structured['note'] = $customMetadata['note'];
        }

        // Keep other metadata fields (excluding ones we've already handled)
        foreach ($customMetadata as $key => $value) {
            if (!in_array($key, ['action', 'context', 'note'])) {
                $structured[$key] = $value;
            }
        }

        return $structured;
    }
}