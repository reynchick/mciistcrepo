<?php

namespace App\Http\Actions\Research;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\Researcher;
use App\Models\User;
use App\Services\ResearchInvitationService;
use Illuminate\Support\Facades\Log;

class InviteResearchersAction extends ResearchWorkflowAction
{
    public function __construct(protected ResearchInvitationService $invitationService)
    {
    }

    public function execute(Research $research, User $user): bool
    {
        if ($research->status !== ResearchStatus::DRAFT) {
            abort(403, 'Initial invitations may only be sent from a draft research entry.');
        }

        $researchers = $research->researchers()->get();
        if ($researchers->isEmpty()) {
            abort(422, 'No researchers are available to invite.');
        }

        $invitations = [];
        foreach ($researchers as $researcher) {
            if (blank($researcher->email)) {
                abort(422, 'Every researcher must have an email address before sending initial invitations.');
            }

            if ($researcher->hasActiveInvitation()) {
                continue;
            }

            $created = $this->invitationService->createForResearcher($researcher);
            $invitations[] = [
                'researcher_id' => $researcher->id,
                'email' => $researcher->email,
                'invitation_id' => $created['invitation']->id,
                'token' => $created['token'],
            ];
        }

        if (empty($invitations)) {
            abort(422, 'No new invitations were created.');
        }

        $result = $this->applyStatusChange(
            $research,
            $user,
            ResearchEntryLog::ACTION_INVITE_RESEARCHERS,
            [
                'status' => ResearchStatus::DRAFT_INVITED,
            ],
            [
                'invitation_count' => count($invitations),
                'researcher_ids' => array_column($invitations, 'researcher_id'),
            ],
            function () use ($research, $invitations) {
                foreach ($invitations as $invitation) {
                    try {
                        $this->mailService()->sendResearchInvited($research, $invitation['email'], $invitation['token']);
                    } catch (\Throwable $exception) {
                        Log::error('Failed to queue initial research invitation.', [
                            'research_id' => $research->id,
                            'researcher_id' => $invitation['researcher_id'],
                            'exception' => $exception,
                        ]);
                    }
                }
            }
        );

        return $result;
    }
}
