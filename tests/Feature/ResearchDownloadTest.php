<?php

use App\Models\Faculty;
use App\Models\GuestFileRequest;
use App\Models\GuestFileRequestAccessGrant;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function uploadResearchWithFiles(User $staff): Research
{
    $program = Program::factory()->create(['name' => 'BS Computer Science', 'code' => 'BSCS']);
    $adviser = Faculty::create(['faculty_id' => 'DL-ADV-' . uniqid(), 'first_name' => 'Test', 'last_name' => 'Adviser']);

    $response = test()->actingAs($staff)->post('/research', [
        'research_title' => 'Download Flow Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'completed_year' => 2025,
        'research_abstract' => 'Abstract for download test.',
        'researchers' => [
            ['first_name' => 'Alice', 'last_name' => 'Wonder', 'email' => 'alice.dl@usep.edu.ph'],
        ],
        'keywords' => ['DownloadKeyword'],
        'research_manuscript' => \Illuminate\Http\UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf'),
    ]);

    $response->assertSessionHasNoErrors();

    $research = Research::where('research_title', 'Download Flow Research')->firstOrFail();
    $research->forceFill(['status' => 'posted', 'posted_at' => now()])->save();

    return $research;
}

function grantManuscriptDownload(Research $research, User $user): void
{
    $request = GuestFileRequest::create([
        'research_id' => $research->id,
        'guest_user_id' => $user->id,
        'guest_session_id' => 'download-test-session',
        'file_type' => 'manuscript',
        'status' => 'approved',
    ]);

    GuestFileRequestAccessGrant::create([
        'guest_file_request_id' => $request->id,
        'guest_user_id' => $user->id,
        'research_id' => $research->id,
        'file_type' => 'manuscript',
        'granted_at' => now(),
    ]);
}

test('a manuscript downloads with an active access grant and a sensible filename', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $staff = User::factory()->asMCIISStaff()->create();
    $research = uploadResearchWithFiles($staff);
    $guest = User::factory()->create();
    grantManuscriptDownload($research, $guest);

    $manuscriptResponse = $this->actingAs($guest)->get("/research/{$research->id}/manuscript");
    $manuscriptResponse->assertOk();
    $manuscriptResponse->assertHeader('content-disposition');
    expect($manuscriptResponse->headers->get('content-disposition'))->toContain('Download_Flow_Research_Manuscript.pdf');
});

test('manuscript downloads are denied without an access grant', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $staff = User::factory()->asMCIISStaff()->create();
    $research = uploadResearchWithFiles($staff);
    $student = User::factory()->asStudent()->create(['student_access_approved' => true]);

    $this->actingAs($staff)->get("/research/{$research->id}/manuscript")->assertForbidden();
    $this->actingAs($student)->get("/research/{$research->id}/manuscript")->assertForbidden();
});

test('a revoked manuscript grant no longer permits download', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $staff = User::factory()->asMCIISStaff()->create();
    $research = uploadResearchWithFiles($staff);
    $guest = User::factory()->create();
    grantManuscriptDownload($research, $guest);
    GuestFileRequestAccessGrant::query()->update(['revoked_at' => now()]);

    $this->actingAs($guest)->get("/research/{$research->id}/manuscript")->assertForbidden();
});

test('a missing manuscript with an active grant returns unavailable', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $program = Program::factory()->create();
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_manuscript' => null,
    ]);
    $staff = User::factory()->asMCIISStaff()->create();
    grantManuscriptDownload($research, $staff);

    $response = $this->actingAs($staff)->get("/research/{$research->id}/manuscript");
    $response->assertStatus(410);
});
