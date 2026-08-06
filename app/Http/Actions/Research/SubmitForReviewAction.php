<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use App\Services\PostingReadinessService;
use InvalidArgumentException;

class SubmitForReviewAction extends ResearchWorkflowAction
{
    public function __construct(protected PostingReadinessService $readinessService)
    {
    }

    public function execute(Research $research, User $user, ?string $note = null): bool
    {
        if (! blank($note)) {
            $this->requireNote($note, 'A note is optional for submission.');
        }

        $this->readinessService->ensureReady($research);

        $attributes = [
            'status' => 'submitted',
            'submitted_at' => now(),
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_SUBMIT_FOR_REVIEW, $attributes, [
            'note' => $note,
            'context' => 'workflow_submit',
        ], $this->safeAfterCommitCallable(
            fn () => $this->notifyResearchSubmitted($research),
            'Failed to queue research submission notification.',
            ['research_id' => $research->id]
        ));
    }
}
