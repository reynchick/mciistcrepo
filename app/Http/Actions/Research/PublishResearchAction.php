<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class PublishResearchAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, ?string $note = null): bool
    {
        $this->validatePublishRequirements($research);

        $attributes = [
            'status' => 'published',
            'published_at' => now(),
            'submitted_at' => $research->submitted_at ?? now(),
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_PUBLISH, $attributes, [
            'note' => $note,
            'context' => 'workflow_publish',
        ]);
    }
}
