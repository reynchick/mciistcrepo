<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use App\Support\ResearchStatusConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('staff can transition draft research to submitted with a note', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-STAT-1',
        'first_name' => 'Status',
        'last_name' => 'Tester',
    ]);

    $research = Research::factory()->draft()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Status Transition Research',
        'research_abstract' => 'A draft prepared for status transition tests.',
    ]);

    $response = $this->actingAs($staff)->post("/research/{$research->id}/status", [
        'status' => ResearchStatus::SUBMITTED->value,
        'note' => 'Ready for review',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect($research->refresh()->status)->toBe(ResearchStatus::SUBMITTED);
});

test('status config exposes draft invited and archive restore transitions', function () {
    expect(ResearchStatusConfig::defaults()['restore'])->toBe('draft')
        ->and(ResearchStatusConfig::statuses())->toHaveKey('draft_invited')
        ->and(ResearchStatusConfig::canTransition('draft', 'draft_invited', 'faculty'))->toBeTrue()
        ->and(ResearchStatusConfig::canTransition('archived', 'draft', 'staff'))->toBeTrue();
});

test('archived research restores to draft and clears archive metadata', function () {
    $user = User::factory()->create();
    $research = Research::factory()->create([
        'status' => ResearchStatus::ARCHIVED,
        'archived_at' => now()->subDay(),
        'archived_by' => $user->id,
        'archive_reason' => 'No longer active',
    ]);

    $result = $research->restore();

    expect($result)->toBeTrue()
        ->and($research->refresh()->status)->toEqual(ResearchStatus::DRAFT)
        ->and($research->refresh()->archived_at)->toBeNull()
        ->and($research->refresh()->archived_by)->toBeNull()
        ->and($research->refresh()->archive_reason)->toBeNull();
});

test('research model reports whether students can edit based on status and collaboration', function () {
    $research = Research::factory()->make([
        'status' => ResearchStatus::DRAFT_INVITED,
        'student_collaboration_enabled' => true,
    ]);

    expect($research->canStudentsEdit())->toBeTrue();

    $research->status = ResearchStatus::POSTED;

    expect($research->canStudentsEdit())->toBeFalse();
});

test('withdraw route does not exist for research workflow', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->draft()->create();

    $response = $this->actingAs($staff)->post("/research/{$research->id}/withdraw");

    $response->assertStatus(404);
});
