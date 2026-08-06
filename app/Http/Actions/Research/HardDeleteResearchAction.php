<?php

namespace App\Http\Actions\Research;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class HardDeleteResearchAction extends ResearchWorkflowAction
{
    public function execute(Research $research, User $user, string $reason): bool
    {
        $this->assertStaffAccess($user);

        if (! $user->can('hardDelete', $research)) {
            abort(403, 'You are not allowed to hard delete this research.');
        }

        if ($research->status === ResearchStatus::DRAFT) {
            if ($research->hasInvitationOrAccessHistory()) {
                abort(403, 'Original drafts with invitation or access history cannot be hard deleted.');
            }
        } elseif ($research->status === ResearchStatus::ARCHIVED && $research->archived_at) {
            $retentionDays = config('research.hard_delete_retention_days', 365);
            if ($research->archived_at->gt(now()->subDays($retentionDays))) {
                abort(403, 'Archived research must exceed the retention period before hard deletion.');
            }
        } else {
            abort(403, 'Research is not eligible for hard deletion.');
        }

        return DB::transaction(function () use ($research, $user, $reason): bool {
            $oldValues = $research->getAttributes();
            $metadata = [
                'context' => 'hard_delete',
                'reason' => $reason,
                'researcher_count' => $research->researchers()->count(),
                'file_count' => collect([
                    $research->research_approval_sheet,
                    $research->research_manuscript,
                ])->filter()->count(),
            ];

            ResearchEntryLog::create([
                'modified_by' => $user->id,
                'target_research_id' => $research->id,
                'action_type' => ResearchEntryLog::ACTION_HARD_DELETE,
                'old_values' => [
                    'research_id' => $research->id,
                    'research_title' => $research->research_title,
                    'status' => $research->status?->value ?? $research->status,
                    'prior_status' => $research->status?->value ?? $research->status,
                    'reason' => $reason,
                    'researcher_count' => $metadata['researcher_count'],
                    'file_count' => $metadata['file_count'],
                ],
                'new_values' => null,
                'metadata' => $metadata,
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
            ]);

            return $research->delete();
        });
    }
}
