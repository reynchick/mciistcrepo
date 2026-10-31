<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests can view posted research details without signing in', function () {
    $program = Program::factory()->create();
    $faculty = Faculty::create([
        'faculty_id' => 'F-GUEST-1',
        'first_name' => 'Guest',
        'last_name' => 'Adviser',
    ]);
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $faculty->id,
        'status' => ResearchStatus::POSTED,
        'research_title' => 'Guest Viewable Research',
        'research_abstract' => 'A public abstract.',
        'completed_year' => 2025,
    ]);

    $response = $this->get("/research/{$research->id}/details");

    $response->assertOk();
    $response->assertJsonPath('data.research_title', 'Guest Viewable Research');
});

test('guest manuscript requests are no longer accepted', function () {
    $program = Program::factory()->create();
    $faculty = Faculty::create([
        'faculty_id' => 'F-GUEST-2',
        'first_name' => 'Guest',
        'last_name' => 'Lead',
    ]);
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $faculty->id,
        'status' => ResearchStatus::POSTED,
        'research_title' => 'Requestable Research',
        'completed_year' => 2025,
    ]);
    $research->researchers()->create([
        'first_name' => 'Lead',
        'last_name' => 'Author',
        'email' => 'lead.author@example.com',
        'is_lead_author' => true,
    ]);

    $leadAuthor = User::factory()->create([
        'email' => 'lead.author@example.com',
        'first_name' => 'Lead',
        'last_name' => 'Author',
    ]);
    // Link the researcher row to the created user account so authorization
    // checks that rely on `researchers.user_id` work deterministically.
    $research->researchers()->where('is_lead_author', true)->update(['user_id' => $leadAuthor->id]);
    $faculty->forceFill(['email' => 'adviser@example.com'])->save();
    $adviserUser = User::factory()->create([
        'email' => 'adviser@example.com',
        'first_name' => 'Adviser',
        'last_name' => 'User',
    ]);
    $adviserUser->faculty()->associate($faculty)->save();

    $requestResponse = $this->actingAs($leadAuthor)->postJson("/guest/research/{$research->id}/request", [
        'file_type' => 'manuscript',
    ]);

    $requestResponse->assertGone();
    $this->assertDatabaseCount('guest_file_requests', 0);
});

test('a legacy approved guest grant cannot download a manuscript', function () {
    \Illuminate\Support\Facades\Storage::fake('private');

    $program = Program::factory()->create();
    $faculty = Faculty::create([
        'faculty_id' => 'F-GUEST-3',
        'first_name' => 'Guest',
        'last_name' => 'Adviser',
    ]);
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $faculty->id,
        'status' => ResearchStatus::POSTED,
        'research_title' => 'Downloadable Research',
        'completed_year' => 2025,
    ]);
    $path = \Illuminate\Http\UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf')
        ->store('research/manuscripts', 'private');
    $research->forceFill(['research_manuscript' => $path])->save();

    $guest = User::factory()->create();

    $request = \App\Models\GuestFileRequest::create([
        'research_id' => $research->id,
        'guest_user_id' => $guest->id,
        'guest_session_id' => 'legacy-approved-session',
        'file_type' => 'manuscript',
        'status' => 'approved',
    ]);
    \App\Models\GuestFileRequestAccessGrant::create([
        'guest_file_request_id' => $request->id,
        'guest_user_id' => $guest->id,
        'research_id' => $research->id,
        'file_type' => 'manuscript',
        'granted_at' => now(),
    ]);

    $this->actingAs($guest)->get("/research/{$research->id}/manuscript")
        ->assertForbidden();
});
