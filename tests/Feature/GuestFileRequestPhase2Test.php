<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\GuestFileRequest;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function phase2Research(array $attributes = []): Research
{
    Storage::fake('public');
    $faculty = Faculty::create([
        'faculty_id' => 'F-PHASE2-' . uniqid(),
        'first_name' => 'Phase',
        'last_name' => 'Adviser',
    ]);

    $research = Research::factory()->create(array_merge([
        'research_adviser' => $faculty->id,
        'program_id' => Program::factory(),
        'status' => ResearchStatus::POSTED,
        'research_manuscript' => 'research/manuscript.pdf',
    ], $attributes));
    Storage::disk('public')->put($research->research_manuscript, 'pdf');

    return $research;
}

function phase2Requester(array $attributes = []): User
{
    return User::factory()->asStudent()->create(array_merge([
        'google_id' => 'google-' . uniqid(),
        'email_verified_at' => now(),
        'student_profile_completed' => true,
    ], $attributes));
}

test('guests cannot create file requests', function () {
    $research = phase2Research();

    $this->postJson("/guest/research/{$research->id}/request", ['file_type' => 'manuscript'])
        ->assertUnauthorized();
});

test('authenticated users without a valid institutional SSO identity cannot create requests', function () {
    $research = phase2Research();
    $user = phase2Requester(['email' => 'person@example.com']);

    $this->withSession(['sso_authenticated_at' => now()->timestamp])->actingAs($user)
        ->postJson("/guest/research/{$research->id}/request", ['file_type' => 'manuscript'])
        ->assertUnauthorized();
});

test('a valid SSO requester receives the same active request for duplicates', function () {
    $research = phase2Research();
    $user = phase2Requester();
    $request = $this->withSession(['sso_authenticated_at' => now()->timestamp])->actingAs($user);

    $first = $request->postJson("/guest/research/{$research->id}/request", ['file_type' => 'manuscript'])
        ->assertOk()->json('data.id');
    $second = $request->postJson("/guest/research/{$research->id}/request", ['file_type' => 'manuscript'])
        ->assertOk()->json('data.id');

    expect($second)->toBe($first);
    expect(GuestFileRequest::where('guest_user_id', $user->id)->count())->toBe(1);
});

test('linked students and stakeholders cannot submit requests', function () {
    $research = phase2Research();
    $student = phase2Requester();
    $research->researchers()->create(['user_id' => $student->id, 'first_name' => 'Linked', 'last_name' => 'Student']);

    $this->withSession(['sso_authenticated_at' => now()->timestamp])->actingAs($student)
        ->postJson("/guest/research/{$research->id}/request", ['file_type' => 'manuscript'])
        ->assertForbidden();
});

test('unrelated students cannot directly download research files', function () {
    Storage::fake('public');
    $research = phase2Research();
    Storage::disk('public')->put($research->research_manuscript, 'pdf');
    $student = phase2Requester();

    $this->actingAs($student)->get("/research/{$research->id}/manuscript")
        ->assertForbidden();
});

test('a missing adviser account does not immediately escalate a new request', function () {
    $research = phase2Research();
    $user = phase2Requester();

    $this->withSession(['sso_authenticated_at' => now()->timestamp])->actingAs($user)
        ->postJson("/guest/research/{$research->id}/request", ['file_type' => 'manuscript'])
        ->assertOk()
        ->assertJsonPath('data.status', 'pending_adviser_approval');
});