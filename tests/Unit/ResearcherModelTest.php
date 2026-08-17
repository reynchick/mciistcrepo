<?php

use App\Models\Research;
use App\Models\Researcher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('researcher access helpers track user links and pending invitations', function () {
    $user = User::factory()->create();
    $research = Research::factory()->create();
    $researcher = $research->researchers()->create([
        'first_name' => 'Ana',
        'last_name' => 'Cruz',
        'email' => 'ana@example.edu',
        'user_id' => $user->id,
    ]);

    expect($researcher->user()->exists())->toBeTrue();
    expect($researcher->hasCurrentAccess())->toBeTrue();
    expect($researcher->hasActiveInvitation())->toBeFalse();

    $researcher->invitations()->create([
        'token_hash' => 'active-token',
        'email_snapshot' => 'ana@example.edu',
        'expires_at' => now()->addDay(),
    ]);

    expect($researcher->hasActiveInvitation())->toBeTrue();

    $researcher->revokePendingInvitations();
    $researcher->refresh();

    expect($researcher->hasCurrentAccess())->toBeTrue();
    expect($researcher->invitations()->whereNotNull('revoked_at')->exists())->toBeTrue();

    $researcher->revokeAccess();
    $researcher->refresh();

    expect($researcher->user_id)->toBeNull();
    expect($researcher->hasCurrentAccess())->toBeFalse();
});

test('researcher invitations expose their lifecycle state safely', function () {
    $research = Research::factory()->create();
    $researcher = $research->researchers()->create([
        'first_name' => 'Leo',
        'last_name' => 'Reyes',
        'email' => 'leo@example.edu',
    ]);

    $activeInvitation = $researcher->invitations()->create([
        'token_hash' => 'active-invitation',
        'email_snapshot' => 'leo@example.edu',
        'expires_at' => now()->addDay(),
    ]);
    $acceptedInvitation = $researcher->invitations()->create([
        'token_hash' => 'accepted-invitation',
        'email_snapshot' => 'leo@example.edu',
        'accepted_at' => now(),
        'expires_at' => now()->addDay(),
    ]);
    $revokedInvitation = $researcher->invitations()->create([
        'token_hash' => 'revoked-invitation',
        'email_snapshot' => 'leo@example.edu',
        'revoked_at' => now(),
        'expires_at' => now()->addDay(),
    ]);
    $expiredInvitation = $researcher->invitations()->create([
        'token_hash' => 'expired-invitation',
        'email_snapshot' => 'leo@example.edu',
        'expires_at' => now()->subDay(),
    ]);

    expect($activeInvitation->isActive())->toBeTrue();
    expect($activeInvitation->isExpired())->toBeFalse();
    expect($acceptedInvitation->isAccepted())->toBeTrue();
    expect($revokedInvitation->isRevoked())->toBeTrue();
    expect($expiredInvitation->isExpired())->toBeTrue();
    expect($expiredInvitation->isActive())->toBeFalse();
});
