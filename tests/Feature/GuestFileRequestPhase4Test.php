<?php

use App\Mail\FileAccessRequestEscalatedMail;
use App\Mail\FileAccessRequestExpiredMail;
use App\Mail\FileAccessRequestMail;
use App\Models\Faculty;
use App\Models\GuestFileRequest;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use App\Services\FileAccessRequestWorkflowService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function phase4Request(array $attributes = []): GuestFileRequest
{
    $faculty = Faculty::create([
        'faculty_id' => 'F-PHASE4-' . uniqid(),
        'first_name' => 'Phase',
        'last_name' => 'Adviser',
    ]);
    $requester = User::factory()->asStudent()->create(['student_profile_completed' => true]);
    $research = Research::factory()->create([
        'program_id' => Program::factory(),
        'research_adviser' => $faculty->id,
        'status' => 'posted',
        'research_manuscript' => 'research/phase4.pdf',
    ]);

    $request = GuestFileRequest::create(array_merge([
        'research_id' => $research->id,
        'guest_user_id' => $requester->id,
        'file_type' => 'manuscript',
        'status' => 'pending_adviser_approval',
        'approval_policy' => 'adviser_final',
        'expires_at' => now()->addDays(14),
    ], $attributes));

    if (isset($attributes['created_at'])) {
        $request->forceFill(['created_at' => $attributes['created_at']])->save();
    }

    return $request;
}

test('recipient notification queues only eligible adviser and lead mail', function () {
    Mail::fake();
    $request = phase4Request();
    $adviser = User::factory()->asFaculty()->create([
        'faculty_id' => $request->research->adviser->faculty_id,
        'faculty_profile_completed' => true,
        'email_verified_at' => now(),
    ]);
    $request->research->researchers()->create([
        'user_id' => User::factory()->asStudent()->create([
            'student_profile_completed' => true,
            'email_verified_at' => now(),
        ])->id,
        'first_name' => 'Lead',
        'last_name' => 'Author',
        'is_lead_author' => true,
    ]);
    $request->research->refresh();
    $workflow = app(FileAccessRequestWorkflowService::class);
    $tokens = $workflow->issueRecipientTokens($request);
    $workflow->queueRecipientNotifications($request, $tokens);

    expect($tokens)->toHaveKeys(['adviser', 'lead']);
    Mail::assertQueued(FileAccessRequestMail::class, 2);
    expect($request->fresh()->adviser_email_status)->toBe('queued')
        ->and($request->fresh()->lead_email_status)->toBe('queued');
});

test('the daily command escalates once and expires unresolved requests', function () {
    Mail::fake();
    User::factory()->asMCIISStaff()->create(['email_verified_at' => now()]);
    $escalated = phase4Request(['created_at' => now()->subDays(8)]);
    $expired = phase4Request(['expires_at' => now()->subMinute()]);

    Artisan::call('file-access-requests:process');
    Artisan::call('file-access-requests:process');

    expect($escalated->fresh()->status)->toBe('escalated')
        ->and($escalated->fresh()->escalated_at)->not->toBeNull()
        ->and($expired->fresh()->status)->toBe('expired')
        ->and($escalated->fresh()->events()->where('event', 'escalated')->count())->toBe(1);
    Mail::assertQueued(FileAccessRequestEscalatedMail::class);
    Mail::assertQueued(FileAccessRequestExpiredMail::class);
});