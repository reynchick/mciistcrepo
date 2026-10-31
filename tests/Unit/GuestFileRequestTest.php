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

test('lead consent approval is disabled', function () {
    $request = makeGuestRequestForTest();
    $lead = User::factory()->create();

    expect(fn () => $request->approve('lead', $lead))
        ->toThrow(RuntimeException::class, 'Manuscript access approvals are no longer available.');
    expect($request->fresh()->status)->toBe('pending_adviser_approval')
        ->and(GuestFileRequestAccessGrant::count())->toBe(0);
});

test('final approval cannot create a requester-bound grant', function () {
    $request = makeGuestRequestForTest();
    $adviser = User::factory()->create();

    expect(fn () => $request->approve('adviser', $adviser))
        ->toThrow(RuntimeException::class, 'Manuscript access approvals are no longer available.');
    expect($request->fresh()->status)->toBe('pending_adviser_approval')
        ->and(GuestFileRequestAccessGrant::count())->toBe(0);
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