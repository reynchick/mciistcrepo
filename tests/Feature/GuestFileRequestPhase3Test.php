<?php

use App\Models\Faculty;
use App\Models\GuestFileRequest;
use App\Models\GuestFileRequestAccessGrant;
use App\Models\GuestFileRequestToken;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use App\Services\FileAccessRequestWorkflowService;
use App\Mail\FileAccessRequestApprovedMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

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
    $requester = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);
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

test('lead author can submit consent with the review token', function () {
    Mail::fake();
    ['request' => $request] = phase3Request();
    $lead = User::factory()->asStudent()->create([
        'email' => 'lead.author@usep.edu.ph',
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);
    $request->research->researchers()->create([
        'user_id' => $lead->id,
        'first_name' => 'Lead',
        'last_name' => 'Author',
        'email' => $lead->email,
        'is_lead_author' => true,
    ]);
    $request->refresh();
    $rawToken = app(FileAccessRequestWorkflowService::class)->issueToken($request, 'lead');

    $this->actingAs($lead)->postJson("/guest/file-requests/{$request->id}/approve", [
        'token' => $rawToken,
    ])->assertOk();

    expect($request->fresh()->lead_approved_at)->not->toBeNull()
        ->and($request->fresh()->status)->toBe('pending_adviser_approval');
    Mail::assertNotSent(FileAccessRequestApprovedMail::class);
});

test('lead-author students can view only their access request inbox', function () {
    ['request' => $request] = phase3Request();
    $lead = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
        'email' => 'lead.inbox@usep.edu.ph',
    ]);
    $request->research->researchers()->create([
        'user_id' => $lead->id,
        'first_name' => 'Lead',
        'last_name' => 'Author',
        'email' => $lead->email,
        'is_lead_author' => true,
    ]);

    $this->actingAs($lead)->get('/student/access-requests')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('file-access-requests/index')
            ->where('queue', 'student')
            ->where('tab', 'pending')
            ->has('requests', 1));

    $request->forceFill(['status' => 'approved'])->save();

    $this->actingAs($lead)->get('/student/access-requests?status=approved')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('tab', 'approved')
            ->has('requests', 1));

    $unrelatedStudent = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);
    $this->actingAs($unrelatedStudent)->get('/student/access-requests')->assertForbidden();
});

test('final adviser approval emails the requester with the requested file', function () {
    Storage::fake('private');
    Mail::fake();
    ['request' => $request, 'adviser' => $adviser, 'requester' => $requester] = phase3Request();
    $request->research->forceFill(['research_manuscript' => 'research/phase3.pdf'])->save();
    Storage::disk('private')->put('research/phase3.pdf', 'pdf contents');

    $workflow = app(FileAccessRequestWorkflowService::class);
    $rawToken = $workflow->issueToken($request, 'adviser');
    $workflow->approve($request, $adviser, $rawToken);

    Mail::assertSent(FileAccessRequestApprovedMail::class, fn (FileAccessRequestApprovedMail $mail): bool =>
        $mail->request->is($request->fresh())
        && $mail->attachments() !== []
    );
    expect($requester->email)->not->toBeNull();
});