<?php

namespace App\Http\Actions\Research;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class HardDeleteResearchAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, string $reason): bool
    {
        $this->assertStaffAccess($user);

        if (! $user->isAdministrator() && $research->status !== ResearchStatus::DRAFT) {
            abort(403, 'Staff may only hard delete draft research.');
        }

        $this->logResearchChange($research, $user, ResearchEntryLog::ACTION_HARD_DELETE, $research->getAttributes(), null, [
            'context' => 'hard_delete',
            'reason' => $reason,
        ]);

        return $research->forceDelete();
    }
}
