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
        'published_year' => 2025,
        'research_abstract' => 'Abstract for download test.',
        'researchers' => [
            ['first_name' => 'Alice', 'last_name' => 'Wonder', 'email' => 'alice.dl@usep.edu.ph'],
        ],
        'keywords' => ['DownloadKeyword'],
        'research_approval_sheet' => \Illuminate\Http\UploadedFile::fake()->create('approval.pdf', 100, 'application/pdf'),
        'research_manuscript' => \Illuminate\Http\UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf'),
    ]);

    $response->assertSessionHasNoErrors();

    return Research::where('research_title', 'Download Flow Research')->firstOrFail();
}

test('uploaded manuscript and approval sheet download as valid files with sensible names', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $research = uploadResearchWithFiles($staff);

    $manuscriptResponse = $this->actingAs($staff)->get("/research/{$research->id}/manuscript");
    $manuscriptResponse->assertOk();
    $manuscriptResponse->assertHeader('content-disposition');
    expect($manuscriptResponse->headers->get('content-disposition'))->toContain('Download_Flow_Research_Manuscript.pdf');

    $approvalResponse = $this->actingAs($staff)->get("/research/{$research->id}/approval-sheet");
    $approvalResponse->assertOk();
    expect($approvalResponse->headers->get('content-disposition'))->toContain('Download_Flow_Research_Approval_Sheet.pdf');
});

test('a student can download files for research they can view, even though they cannot manage it', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $research = uploadResearchWithFiles($staff);

    $student = User::factory()->asStudent()->create(['profile_completed' => true]);

    $this->actingAs($student)->get("/research/{$research->id}/manuscript")->assertOk();
    $this->actingAs($student)->get("/research/{$research->id}/approval-sheet")->assertOk();
});

test('a legacy image approval sheet downloads with its real extension instead of being mislabeled .pdf', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $program = Program::factory()->create();
    $legacyPath = \Illuminate\Http\UploadedFile::fake()->image('old-approval.jpg')->store('research/approval_sheets', 'public');
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_approval_sheet' => $legacyPath,
        'research_manuscript' => null,
    ]);
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $response = $this->actingAs($staff)->get("/research/{$research->id}/approval-sheet");
    $response->assertOk();
    expect($response->headers->get('content-disposition'))->toContain('.jpg')
        ->not->toContain('.pdf');
});

test('downloading a research with no manuscript on disk fails gracefully instead of crashing', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $program = Program::factory()->create();
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_manuscript' => null,
        'research_approval_sheet' => null,
    ]);
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $response = $this->actingAs($staff)->get("/research/{$research->id}/manuscript");
    $response->assertStatus(400);
    $response->assertJson(['success' => false]);
});
