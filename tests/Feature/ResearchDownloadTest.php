<?php

use App\Models\Faculty;
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

    return Research::where('research_title', 'Download Flow Research')->firstOrFail();
}

test('uploaded manuscript downloads as a valid file with a sensible name', function () {
    \Illuminate\Support\Facades\Storage::fake('private');
    $staff = User::factory()->asMCIISStaff()->create();
    $research = uploadResearchWithFiles($staff);

    $manuscriptResponse = $this->actingAs($staff)->get("/research/{$research->id}/manuscript");
    $manuscriptResponse->assertOk();
    $manuscriptResponse->assertHeader('content-disposition');
    expect($manuscriptResponse->headers->get('content-disposition'))->toContain('Download_Flow_Research_Manuscript.pdf');
});

test('a student can download the manuscript for research they can view, even though they cannot manage it', function () {
    \Illuminate\Support\Facades\Storage::fake('private');
    $staff = User::factory()->asMCIISStaff()->create();
    $research = uploadResearchWithFiles($staff);

    $student = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);

    $this->actingAs($student)->get("/research/{$research->id}/manuscript")->assertOk();
});

test('the assigned faculty can download the manuscript directly and another faculty member cannot', function () {
    \Illuminate\Support\Facades\Storage::fake('private');
    $staff = User::factory()->asMCIISStaff()->create(['faculty_profile_completed' => true]);
    $research = uploadResearchWithFiles($staff);

    $adviser = $research->adviser;
    $assignedFaculty = User::factory()->asFaculty()->create([
        'faculty_id' => $adviser->faculty_id,
        'faculty_profile_completed' => true,
    ]);
    $otherFaculty = User::factory()->asFaculty()->create(['faculty_profile_completed' => true]);

    $this->actingAs($assignedFaculty)->get("/research/{$research->id}/manuscript")->assertOk();
    $this->actingAs($otherFaculty)->get("/research/{$research->id}/manuscript")->assertForbidden();
});

test('downloading a research with no manuscript on disk fails gracefully instead of crashing', function () {
    \Illuminate\Support\Facades\Storage::fake('private');
    $program = Program::factory()->create();
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_manuscript' => null,
    ]);
    $staff = User::factory()->asMCIISStaff()->create();

    $response = $this->actingAs($staff)->get("/research/{$research->id}/manuscript");
    $response->assertStatus(400);
    $response->assertJson(['success' => false]);
});
