<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class ChangeResearchStatusAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, string $status, ?string $note = null): bool
    {
        $this->assertStaffAccess($user);
        $this->requireNote($note, 'A note is required when changing research status.');

        $attributes = [
            'status' => $status,
            'submitted_at' => $research->submitted_at,
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_CHANGE_STATUS, $attributes, [
            'note' => $note,
            'context' => 'staff_status_change',
        ]);
    }
}
