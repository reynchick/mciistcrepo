<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class RequestAdviserMetadataAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, string $note, string $context = 'staff_to_adviser'): bool
    {
        $this->requireNote($note, 'A note is required when requesting adviser metadata.');

        $attributes = [
            'status' => 'returned',
            'submitted_at' => $research->submitted_at,
        ];

        $result = $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_REQUEST_ADVISER_METADATA, $attributes, [
            'note' => $note,
            'context' => $context,
        ]);

        if ($result) {
            $this->notifyAdviserMetadataRequested($research);
        }

        return $result;
    }
}
