<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class HardDeleteResearchAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user): bool
    {
        $this->assertAdminAccess($user);

        $this->logResearchChange($research, $user, ResearchEntryLog::ACTION_HARD_DELETE, $research->getAttributes(), null, [
            'context' => 'hard_delete',
        ]);

        return $research->forceDelete();
    }
}
