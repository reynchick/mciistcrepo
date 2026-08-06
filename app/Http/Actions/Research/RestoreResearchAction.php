<?php

namespace App\Http\Actions\Research;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class RestoreResearchAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user): bool
    {
        if ($research->status !== ResearchStatus::ARCHIVED) {
            abort(403, 'Only archived research can be restored.');
        }

        $this->ensureUniqueTitle($research);

        $attributes = [
            'status' => ResearchStatus::DRAFT,
            'archived_at' => null,
            'archived_by' => null,
            'archive_reason' => null,
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_RESTORE, $attributes, [
            'context' => 'workflow_restore',
        ]);
    }
}
