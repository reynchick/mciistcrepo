<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class ArchiveResearchAction extends ResearchWorkflowAction
{
    /**
     * Archive a research entry with metadata for observer/audit usage.
     */
    public function execute(Research $research, string $reason, User $user): bool
    {
        $this->requireReason($reason);

        $attributes = [
            'status' => 'archived',
            'archived_at' => now(),
            'archived_by' => $user->id,
            'archive_reason' => $reason,
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_ARCHIVE, $attributes, [
            'reason' => $reason,
            'context' => 'workflow_archive',
        ]);
    }
}
