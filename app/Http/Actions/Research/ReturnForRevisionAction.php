<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class ReturnForRevisionAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, string $note, string $context = 'faculty_to_student'): bool
    {
        $this->requireNote($note, 'A note is required when returning research for revision.');

        $attributes = [
            'status' => 'returned',
            'submitted_at' => $research->submitted_at,
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_RETURN_FOR_REVISION, $attributes, [
            'note' => $note,
            'context' => $context,
        ]);
    }
}
