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

        $archiveLog = $research->researchEntryLogsTargeting()
            ->where('action_type', ResearchEntryLog::ACTION_ARCHIVE)
            ->latest('id')
            ->first();

        $previousStatus = ResearchStatus::tryFrom((string) data_get($archiveLog?->old_values, 'status'));
        // Old archive records may predate the audit log.  Draft is the safe
        // fallback, while new records always return to their archived status.
        $restoredStatus = $previousStatus && $previousStatus !== ResearchStatus::ARCHIVED
            ? $previousStatus
            : ResearchStatus::DRAFT;
        $revokedResearcherAccess = data_get($archiveLog?->metadata, 'revoked_researcher_access', []);

        $attributes = [
            'status' => $restoredStatus,
            'archived_at' => null,
            'archived_by' => null,
            'archive_reason' => null,
        ];

        return $this->applyStatusChange($research, $user, ResearchEntryLog::ACTION_RESTORE, $attributes, [
            'context' => 'workflow_restore',
            'restored_status' => $restoredStatus->value,
        ], function () use ($research, $revokedResearcherAccess): void {
            if (! is_array($revokedResearcherAccess) || $revokedResearcherAccess === []) {
                return;
            }

            $validUserIds = User::query()
                ->whereIn('id', array_values($revokedResearcherAccess))
                ->pluck('id')
                ->map(fn ($id) => (int) $id)
                ->all();

            foreach ($revokedResearcherAccess as $researcherId => $userId) {
                if (in_array((int) $userId, $validUserIds, true)) {
                    $research->researchers()
                        ->whereKey($researcherId)
                        ->whereNull('user_id')
                        ->update(['user_id' => $userId]);
                }
            }
        });
    }
}
