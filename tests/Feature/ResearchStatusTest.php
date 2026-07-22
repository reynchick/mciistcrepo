<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
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

test('entry mode values are preserved for staff direct publish research', function () {
    $research = Research::factory()->staffDirectPublish()->create();

    expect($research->entry_mode->value)->toBe('staff_direct_publish');
});

test('withdraw route does not exist for research workflow', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->draft()->create();

    $response = $this->actingAs($staff)->post("/research/{$research->id}/withdraw");

    $response->assertStatus(404);
});
