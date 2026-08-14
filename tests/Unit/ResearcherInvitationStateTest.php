<?php

use App\Models\ResearcherInvitation;

it('classifies invitation as active when no expiry/accepted/revoked', function () {
    $inv = new ResearcherInvitation([
        'expires_at' => null,
        'accepted_at' => null,
        'revoked_at' => null,
    ]);

    expect($inv->isActive())->toBeTrue();
    expect($inv->isExpired())->toBeFalse();
    expect($inv->isAccepted())->toBeFalse();
    expect($inv->isRevoked())->toBeFalse();
});

it('classifies invitation as expired when expiry is past and not accepted/revoked', function () {
    $inv = new ResearcherInvitation([
        'expires_at' => now()->subDay(),
        'accepted_at' => null,
        'revoked_at' => null,
    ]);

    expect($inv->isExpired())->toBeTrue();
    expect($inv->isActive())->toBeFalse();
});

it('classifies invitation as accepted when accepted_at is set', function () {
    $inv = new ResearcherInvitation([
        'accepted_at' => now(),
        'revoked_at' => null,
    ]);

    expect($inv->isAccepted())->toBeTrue();
    expect($inv->isActive())->toBeFalse();
});

it('classifies invitation as revoked when revoked_at is set', function () {
    $inv = new ResearcherInvitation([
        'revoked_at' => now(),
        'accepted_at' => null,
    ]);

    expect($inv->isRevoked())->toBeTrue();
    expect($inv->isActive())->toBeFalse();
});
