<?php

namespace App\Services;

use App\Models\Researcher;
use App\Models\ResearcherInvitation;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class ResearchInvitationService
{
    public function createForResearcher(Researcher $researcher): array
    {
        $researcher->loadMissing('research');

        $token = Str::random(40);
        $hash = Hash::make($token);

        // Always create a fresh invitation row so historical invitations are preserved.
        $invitation = $researcher->invitations()->create([
            'token_hash' => $hash,
            'email_snapshot' => $researcher->email,
            'expires_at' => now()->addDays(7),
        ]);

        return ['invitation' => $invitation, 'token' => $token];
    }

    public function revokeForResearcher(Researcher $researcher): void
    {
        $researcher->invitations()->whereNull('accepted_at')->whereNull('revoked_at')->update([
            'revoked_at' => now(),
        ]);
    }

    public function invalidateToken(string $token): void
    {
        ResearcherInvitation::query()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->get()
            ->filter(fn (ResearcherInvitation $invitation) => Hash::check($token, $invitation->token_hash))
            ->each(fn (ResearcherInvitation $invitation) => $invitation->forceFill(['revoked_at' => now()])->save());
    }

    public function findValidInvitation(string $token): ?ResearcherInvitation
    {
        return ResearcherInvitation::query()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get()
            ->first(fn (ResearcherInvitation $invitation) => Hash::check($token, $invitation->token_hash));
    }

    /**
     * Accept an invitation and attach it to the given user after validation.
     */
    public function accept(ResearcherInvitation $invitation, $user): void
    {
        // Validate that the invitation is still active
        if (! $invitation->isActive()) {
            return;
        }

        // Ensure the research still allows student collaboration
        $research = $invitation->researcher->research;
        if (! $research || ! $research->canStudentsEdit()) {
            return;
        }

        // Ensure the signed-in user's email matches the invitation snapshot
        if (! $user || ! isset($user->email) || strtolower($user->email) !== strtolower($invitation->email_snapshot)) {
            return;
        }

        // Mark invitation as accepted and bind the researcher to the user
        $invitation->forceFill([
            'accepted_at' => now(),
            'revoked_at' => null,
        ])->save();

        $researcher = $invitation->researcher;
        $researcher->forceFill(['user_id' => $user->id])->save();
    }

    /**
     * Revoke an accepted researcher's access by clearing their user_id.
     */
    public function revokeAcceptedAccess(Researcher $researcher): void
    {
        $researcher->forceFill(['user_id' => null])->save();
    }
}
