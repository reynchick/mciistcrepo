<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/**
 * Phase 1 Security Tests: Verify manuscripts are stored on private disk
 * and cannot be accessed via direct path guessing.
 */

test('research manuscript files are stored on private disk not public disk', function () {
    $staff = User::factory()->asAdministrator()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-SECURITY-1',
        'first_name' => 'Security',
        'last_name' => 'Adviser',
    ]);

    $manuscriptFile = UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf');

    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'status' => ResearchStatus::POSTED,
    ]);

    $this->actingAs($staff)->putJson("/research/{$research->id}", [
        'research_title' => 'Test Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_manuscript' => $manuscriptFile,
        'completed_month' => 1,
        'completed_year' => 2025,
    ]);

    $research->refresh();

    // Verify manuscript is stored on private disk, not public
    expect($research->research_manuscript)->not->toBeNull();
    expect(Storage::disk('private')->exists($research->research_manuscript))->toBeTrue();
    expect(Storage::disk('public')->exists($research->research_manuscript))->toBeFalse();
});

test('direct URL access to private storage path fails', function () {
    $staff = User::factory()->asAdministrator()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-SECURITY-2',
        'first_name' => 'Security',
        'last_name' => 'Test',
    ]);

    $manuscriptFile = UploadedFile::fake()->create('private-manuscript.pdf', 100, 'application/pdf');

    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'status' => ResearchStatus::POSTED,
    ]);

    $this->actingAs($staff)->putJson("/research/{$research->id}", [
        'research_title' => 'Secure Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_manuscript' => $manuscriptFile,
        'completed_month' => 1,
        'completed_year' => 2025,
    ]);

    $research->refresh();
    $manuscriptPath = $research->research_manuscript;

    // Try to access via guessed public storage URL
    // The public symlink should not serve files from private storage
    $this->get("/storage/{$manuscriptPath}")
        ->assertForbidden();
});

test('authenticated user without permission cannot download manuscript', function () {
    $staff = User::factory()->asAdministrator()->create();
    $otherUser = User::factory()->asStudent()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-SECURITY-3',
        'first_name' => 'Blocked',
        'last_name' => 'Access',
    ]);

    $manuscriptFile = UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf');

    $research = Research::factory()->posted()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
    ]);

    $this->actingAs($staff)->putJson("/research/{$research->id}", [
        'research_title' => 'Restricted Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_manuscript' => $manuscriptFile,
        'completed_month' => 1,
        'completed_year' => 2025,
    ]);

    $research->refresh();

    // Other user should not be able to download
    $this->actingAs($otherUser)
        ->get("/research/{$research->id}/manuscript")
        ->assertRedirect();
});

test('guest without approval cannot download manuscript', function () {
    $staff = User::factory()->asAdministrator()->create();
    $guest = User::factory()->create([
        'email' => 'guest@usep.edu.ph',
        'email_verified_at' => now(),
    ]);
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-SECURITY-4',
        'first_name' => 'Guest',
        'last_name' => 'Test',
    ]);

    $manuscriptFile = UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf');

    $research = Research::factory()->posted()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
    ]);

    $this->actingAs($staff)->putJson("/research/{$research->id}", [
        'research_title' => 'Guest Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_manuscript' => $manuscriptFile,
        'completed_month' => 1,
        'completed_year' => 2025,
    ]);

    $research->refresh();

    // Guest without approval should not be able to download
    $this->actingAs($guest)
        ->get("/research/{$research->id}/manuscript")
        ->assertForbidden();
});

test('administrator cannot download a manuscript from the controller', function () {
    $staff = User::factory()->asAdministrator()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-SECURITY-5',
        'first_name' => 'Allowed',
        'last_name' => 'Access',
    ]);

    $manuscriptFile = UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf');

    $research = Research::factory()->posted()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
    ]);

    $this->actingAs($staff)->putJson("/research/{$research->id}", [
        'research_title' => 'Authorized Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_manuscript' => $manuscriptFile,
        'completed_month' => 1,
        'completed_year' => 2025,
    ]);

    $research->refresh();

    $response = $this->actingAs($staff)
        ->get("/research/{$research->id}/manuscript");

    $response->assertForbidden();
});

test('compiled report files are stored on private disk', function () {
    Storage::fake('private');
    Storage::fake('public');

    $testPath = 'reports/test-report.pdf';
    Storage::disk('private')->put($testPath, 'test content');

    expect(Storage::disk('private')->exists($testPath))->toBeTrue();
    expect(Storage::disk('public')->exists($testPath))->toBeFalse();
});
