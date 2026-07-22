<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests can view published research details without signing in', function () {
    $program = Program::factory()->create();
    $faculty = Faculty::create([
        'faculty_id' => 'F-GUEST-1',
        'first_name' => 'Guest',
        'last_name' => 'Adviser',
    ]);
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $faculty->id,
        'status' => ResearchStatus::PUBLISHED,
        'research_title' => 'Guest Viewable Research',
        'research_abstract' => 'A public abstract.',
        'published_year' => 2025,
    ]);

    $response = $this->get("/research/{$research->id}/details");

    $response->assertOk();
    $response->assertJsonPath('data.research_title', 'Guest Viewable Research');
});

test('guest file requests can be submitted and approved by the lead author and adviser', function () {
    $program = Program::factory()->create();
    $faculty = Faculty::create([
        'faculty_id' => 'F-GUEST-2',
        'first_name' => 'Guest',
        'last_name' => 'Lead',
    ]);
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $faculty->id,
        'status' => ResearchStatus::PUBLISHED,
        'research_title' => 'Requestable Research',
        'published_year' => 2025,
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
    $faculty->forceFill(['email' => 'adviser@example.com'])->save();
    $adviserUser = User::factory()->create([
        'email' => 'adviser@example.com',
        'first_name' => 'Adviser',
        'last_name' => 'User',
    ]);
    $adviserUser->faculty()->associate($faculty)->save();

    $requestResponse = $this->postJson("/guest/research/{$research->id}/request", [
        'file_type' => 'manuscript',
    ]);

    $requestResponse->assertOk();
    $requestResponse->assertJsonPath('data.status', 'requested');

    $requestId = $requestResponse->json('data.id');

    $this->actingAs($leadAuthor)->postJson("/guest/file-requests/{$requestId}/approve", [
        'approval' => 'lead',
    ])->assertOk();

    $this->actingAs($adviserUser)->postJson("/guest/file-requests/{$requestId}/approve", [
        'approval' => 'adviser',
    ])->assertOk();

    $this->assertDatabaseHas('guest_file_requests', [
        'id' => $requestId,
        'status' => 'approved',
    ]);
});

test('an approved guest request can download the manuscript through the public route', function () {
    \Illuminate\Support\Facades\Storage::fake('public');

    $program = Program::factory()->create();
    $faculty = Faculty::create([
        'faculty_id' => 'F-GUEST-3',
        'first_name' => 'Guest',
        'last_name' => 'Adviser',
    ]);
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $faculty->id,
        'status' => ResearchStatus::PUBLISHED,
        'research_title' => 'Downloadable Research',
        'published_year' => 2025,
    ]);
    $path = \Illuminate\Http\UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf')
        ->store('research/manuscripts', 'public');
    $research->forceFill(['research_manuscript' => $path])->save();

    $this->get('/browse');
    $sessionId = session()->getId();

    $request = \App\Models\GuestFileRequest::create([
        'research_id' => $research->id,
        'guest_session_id' => $sessionId,
        'file_type' => 'manuscript',
        'status' => 'approved',
    ]);

    $this->withSession(['_token' => $sessionId])->get("/research/{$research->id}/manuscript")
        ->assertOk();
});
