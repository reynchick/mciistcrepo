<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class MarkLegacyUnavailableAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, string $field): bool
    {
        $this->assertStaffAccess($user);

        $validFields = [
            'manuscript',
            'approval_sheet',
            'panelists',
        ];

        if (! in_array($field, $validFields, true)) {
            abort(422, 'Invalid legacy unavailable field.');
        }

        $timestampKey = "{$field}_unavailable_legacy_at";
        $userKey = "{$field}_unavailable_legacy_by";

        $attributes = [
            $timestampKey => now(),
            $userKey => $user->id,
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_MARK_LEGACY_UNAVAILABLE, $attributes, [
            'field' => $field,
            'context' => 'workflow_legacy_unavailable',
        ]);
    }
}
