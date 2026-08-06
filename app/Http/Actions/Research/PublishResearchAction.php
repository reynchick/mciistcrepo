<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use App\Services\PostingReadinessService;

class PublishResearchAction extends ResearchWorkflowAction
{
    public function __construct(protected PostingReadinessService $readinessService)
    {
    }

    public function execute(Research $research, User $user, ?string $note = null, bool $sendNotification = false): bool
    {
        $this->readinessService->ensureReady($research);

        $attributes = [
            'status' => 'posted',
            'published_at' => now(),
            'submitted_at' => $research->submitted_at ?? now(),
        ];

        $afterCommit = null;
        if ($sendNotification) {
            $afterCommit = $this->safeAfterCommitCallable(
                fn () => $this->notifyResearchPublished($research),
                'Failed to queue post-publication notification.',
                ['research_id' => $research->id]
            );
        }

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_PUBLISH, $attributes, [
            'note' => $note,
            'context' => 'workflow_publish',
            'send_notification' => $sendNotification,
        ], $afterCommit);
    }
}
