<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class ReassignAdviserAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, int $adviserId): bool
    {
        $this->assertStaffAccess($user);

        $oldAdviser = $research->research_adviser;

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_REASSIGN_ADVISER, [
            'research_adviser' => $adviserId,
        ], [
            'old_adviser_id' => $oldAdviser,
            'new_adviser_id' => $adviserId,
            'context' => 'workflow_reassign_adviser',
        ]);
    }
}
