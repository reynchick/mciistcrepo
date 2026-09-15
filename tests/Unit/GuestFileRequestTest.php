<?php

use App\Models\GuestFileRequest;
use App\Models\GuestFileRequestAccessGrant;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function makeGuestRequestForTest(array $overrides = []): GuestFileRequest
{
    $user = User::factory()->create();
    $research = Research::factory()->create(['program_id' => Program::factory()]);

    return GuestFileRequest::create(array_merge([
        'research_id' => $research->id,
        'guest_user_id' => $user->id,
        'file_type' => 'manuscript',
        'status' => 'pending_adviser_approval',
        'approval_policy' => 'adviser_final',
    ], $overrides));
}

test('lead consent remains pending adviser approval', function () {
    $request = makeGuestRequestForTest();
    $lead = User::factory()->create();

    $request->approve('lead', $lead);

    expect($request->fresh()->status)->toBe('pending_adviser_approval')
        ->and($request->fresh()->lead_approved_by)->toBe($lead->id)
        ->and(GuestFileRequestAccessGrant::count())->toBe(0);
});

test('final approval creates one requester-bound grant and is idempotent', function () {
    $request = makeGuestRequestForTest();
    $adviser = User::factory()->create();

    $request->approve('adviser', $adviser);
    $firstApprovedAt = $request->fresh()->adviser_approved_at;
    $request->approve('adviser', User::factory()->create());

    expect($request->fresh()->status)->toBe('approved')
        ->and($request->fresh()->adviser_approved_by)->toBe($adviser->id)
        ->and($request->fresh()->adviser_approved_at->equalTo($firstApprovedAt))->toBeTrue()
        ->and(GuestFileRequestAccessGrant::count())->toBe(1);
});

test('rejection closes the request without changing its original actor', function () {
    $request = makeGuestRequestForTest();
    $rejector = User::factory()->create();

    $request->reject($rejector, 'Unavailable file');
    $request->reject(User::factory()->create(), 'Changed reason');

    expect($request->fresh()->status)->toBe('rejected')
        ->and($request->fresh()->rejected_by)->toBe($rejector->id)
        ->and($request->fresh()->rejection_reason)->toBe('Unavailable file');
});