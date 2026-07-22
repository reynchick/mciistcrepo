<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use InvalidArgumentException;

class SubmitForReviewAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, ?string $note = null): bool
    {
        if (! blank($note)) {
            $this->requireNote($note, 'A note is optional for submission.');
        }

        $attributes = [
            'status' => 'submitted',
            'submitted_at' => now(),
        ];

        $result = $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_SUBMIT_FOR_REVIEW, $attributes, [
            'note' => $note,
            'context' => 'workflow_submit',
        ]);

        if ($result) {
            $this->notifyResearchSubmitted($research);
        }

        return $result;
    }
}
