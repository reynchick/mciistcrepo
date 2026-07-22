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

        $invitation = $researcher->invitations()->whereNull('accepted_at')->whereNull('revoked_at')->latest()->first();

        if ($invitation) {
            $invitation->forceFill([
                'token_hash' => $hash,
                'email_snapshot' => $researcher->email,
                'expires_at' => now()->addDays(7),
                'revoked_at' => null,
                'accepted_at' => null,
            ])->save();

            return ['invitation' => $invitation, 'token' => $token];
        }

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

    public function accept(ResearcherInvitation $invitation): void
    {
        $invitation->forceFill([
            'accepted_at' => now(),
            'revoked_at' => null,
        ])->save();
    }
}
