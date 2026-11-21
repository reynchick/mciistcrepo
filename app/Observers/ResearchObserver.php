<?php


namespace App\Observers;


use App\Models\Research;
use App\Models\ResearchEntryLog;
use Illuminate\Support\Facades\Auth;


class ResearchObserver
{
    private static int $auditSuppressionDepth = 0;

    /**
     * Temporary metadata storage for custom context.
     */
    public static ?array $customMetadata = null;

    public static function withoutAuditLogging(callable $callback): mixed
    {
        self::$auditSuppressionDepth++;

        try {
            return $callback();
        } finally {
            self::$auditSuppressionDepth--;
        }
    }

    /**
     * Handle the Research "created" event.
     */
    public function created(Research $research): void
    {
        if (!$this->shouldLog()) {
            self::$customMetadata = null;
            return;
        }
        $metadata = array_merge(
            ['event' => 'created'],
            self::$customMetadata ?? []
        );


        $this->logResearchEntry(
            $research,
            ResearchEntryLog::ACTION_CREATE,
            null,
            $research->getAttributes(),
            $metadata
        );


        self::$customMetadata = null;
    }


    /**
     * Handle the Research "updated" event.
     */
    public function updated(Research $research): void
    {
        if (!$this->shouldLog()) {
            self::$customMetadata = null;
            return;
        }
        $changes = $research->getChanges();
        $previousValues = $research->getPrevious();
        $changedKeys = array_keys($changes);


        // Ignore technical fields
        $ignored = ['updated_at'];
        $meaningfulChanged = array_diff($changedKeys, $ignored);


        if (empty($meaningfulChanged)) {
            self::$customMetadata = null;
            return;
        }


        $metadata = array_merge(
            ['changed' => $meaningfulChanged],
            self::$customMetadata ?? []
        );


        $oldValues = array_intersect_key($previousValues, array_flip($meaningfulChanged));
        $newValues = array_intersect_key($changes, array_flip($meaningfulChanged));

        $this->logResearchEntry(
            $research,
            ResearchEntryLog::ACTION_UPDATE,
            $oldValues,
            $newValues,
            $metadata
        );


        self::$customMetadata = null;
    }


    /**
     * Handle the Research "deleted" event.
     */
    public function deleted(Research $research): void
    {
        if (!$this->shouldLog()) {
            return;
        }
        $this->logResearchEntry(
            $research,
            ResearchEntryLog::ACTION_ARCHIVE,
            $research->getOriginal(),
            null,
            ['event' => 'deleted']
        );
    }


    /**
     * Create a ResearchEntryLog entry.
     */
    protected function logResearchEntry(
        Research $research,
        string $action,
        ?array $oldValues,
        ?array $newValues,
        array $metadata = []
    ): void {
        ResearchEntryLog::create(array_merge($this->requestContext($research), [
            'target_research_id' => $research->id,
            'action_type' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
        ]));
    }


    /**
     * Common context pulled from the current request/auth.
     */
    protected function requestContext(Research $research = null): array
    {
        return [
            'modified_by' => Auth::id(),
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ];
    }

    protected function shouldLog(): bool
    {
        return self::$auditSuppressionDepth === 0 && !app()->runningInConsole() && request() !== null;
    }
}