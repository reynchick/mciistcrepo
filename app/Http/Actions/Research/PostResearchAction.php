<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use App\Services\PostingReadinessService;

class PostResearchAction extends ResearchWorkflowAction
{
    public function __construct(protected ?PostingReadinessService $readinessService = null)
    {
    }

    public function execute(Research $research, User $user, ?string $note = null, bool $sendNotification = false): bool
    {
        ($this->readinessService ??= app(PostingReadinessService::class))->ensureReady($research);

        $attributes = [
            'status' => 'posted',
            'posted_at' => now(),
            'submitted_at' => $research->submitted_at ?? now(),
        ];

        $afterCommit = null;
        if ($sendNotification) {
            $afterCommit = $this->safeAfterCommitCallable(
                fn () => $this->notifyResearchPosted($research),
                $user,
                $research,
                'Failed to queue post notification.',
                ['research_id' => $research->id]
            );
        }

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_POST, $attributes, [
            'note' => $note,
            'context' => 'workflow_post',
            'send_notification' => $sendNotification,
        ], $afterCommit);
    }
}
