<?php

use App\Models\Faculty;
use App\Models\GuestFileRequest;
use App\Models\GuestFileRequestAccessGrant;
use App\Models\GuestFileRequestToken;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use App\Services\FileAccessRequestWorkflowService;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function phase3Request(): array
{
    $faculty = Faculty::create([
        'faculty_id' => 'F-PHASE3-' . uniqid(),
        'first_name' => 'Phase',
        'last_name' => 'Adviser',
    ]);
    $adviser = User::factory()->asFaculty()->create([
        'faculty_id' => $faculty->faculty_id,
        'faculty_profile_completed' => true,
    ]);
    $requester = User::factory()->asStudent()->create(['student_profile_completed' => true]);
    $research = Research::factory()->create([
        'program_id' => Program::factory(),
        'research_adviser' => $faculty->id,
        'status' => 'posted',
        'research_manuscript' => 'research/phase3.pdf',
    ]);
    $request = GuestFileRequest::create([
        'research_id' => $research->id,
        'guest_user_id' => $requester->id,
        'file_type' => 'manuscript',
        'status' => 'pending_adviser_approval',
        'approval_policy' => 'adviser_final',
        'expires_at' => now()->addDays(14),
    ]);

    return compact('request', 'adviser', 'requester');
}

test('review tokens are hashed, role-bound, and GET review does not approve', function () {
    ['request' => $request, 'adviser' => $adviser] = phase3Request();
    $workflow = app(FileAccessRequestWorkflowService::class);
    $rawToken = $workflow->issueToken($request, 'adviser');

    expect(GuestFileRequestToken::first()->token_hash)->not->toBe($rawToken);

    $role = $workflow->review($request, $adviser, $rawToken);

    expect($role)->toBe('adviser')
        ->and($request->fresh()->status)->toBe('pending_adviser_approval')
        ->and($request->fresh()->adviser_approved_at)->toBeNull();
});

test('wrong user and expired tokens cannot be reviewed', function () {
    ['request' => $request] = phase3Request();
    $workflow = app(FileAccessRequestWorkflowService::class);
    $rawToken = $workflow->issueToken($request, 'adviser');
    $wrongUser = User::factory()->asFaculty()->create(['faculty_profile_completed' => true]);

    expect(fn () => $workflow->review($request, $wrongUser, $rawToken))->toThrow(RuntimeException::class);

    $request->tokens()->update(['expires_at' => now()->subMinute()]);
    expect(fn () => $workflow->review($request, $wrongUser, $rawToken))->toThrow(RuntimeException::class);
});

test('raw token approval can finalize without a session review state', function () {
    ['request' => $request, 'adviser' => $adviser] = phase3Request();
    $workflow = app(FileAccessRequestWorkflowService::class);
    $rawToken = $workflow->issueToken($request, 'adviser');

    $approved = $workflow->approve($request, $adviser, $rawToken);

    expect($approved->status)->toBe('approved')
        ->and($request->fresh()->status)->toBe('approved')
        ->and(GuestFileRequestToken::first()->used_at)->not->toBeNull();
});

test('adviser approval creates one bound grant and repeated action returns final state', function () {
    ['request' => $request, 'adviser' => $adviser] = phase3Request();
    $workflow = app(FileAccessRequestWorkflowService::class);
    $rawToken = $workflow->issueToken($request, 'adviser');
    $workflow->review($request, $adviser, $rawToken);

    $approved = $workflow->approve($request, $adviser);
    $again = $workflow->approve($request, $adviser);

    expect($approved->status)->toBe('approved')
        ->and($again->status)->toBe('approved')
        ->and(GuestFileRequestAccessGrant::count())->toBe(1)
        ->and(GuestFileRequestToken::first()->used_at)->not->toBeNull();
});