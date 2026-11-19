<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use App\Support\ResearchStatusConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('retired review statuses cannot be used as research status transitions', function () {
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

    foreach (['submitted', 'returned'] as $retiredStatus) {
        $this->actingAs($staff)->post("/research/{$research->id}/status", [
            'status' => $retiredStatus,
            'note' => 'Retired status must be rejected',
        ])->assertSessionHasErrors('status');

        expect($research->refresh()->status)->toBe(ResearchStatus::DRAFT);
    }
});

test('status config keeps only the active workflow and supports archive restore transitions', function () {
    expect(ResearchStatusConfig::defaults()['restore'])->toBe('draft')
        ->and(ResearchStatusConfig::canTransition('archived', 'draft', 'staff'))->toBeTrue();
});

test('retired review statuses normalize to draft and the submission timestamp is removed', function () {
    $research = Research::factory()->draft()->create();
    DB::table('researches')->where('id', $research->id)->update(['status' => 'submitted']);

    $migration = require database_path('migrations/2026_11_17_000001_remove_research_review_statuses.php');
    $migration->up();

    expect(DB::table('researches')->where('id', $research->id)->value('status'))->toBe('draft')
        ->and(Schema::hasColumn('researches', 'submitted_at'))->toBeFalse();
});

test('retired review activity types are excluded from research history', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->posted()->create();

    foreach (ResearchEntryLog::RETIRED_REVIEW_ACTION_TYPES as $actionType) {
        ResearchEntryLog::create([
            'modified_by' => $staff->id,
            'target_research_id' => $research->id,
            'action_type' => $actionType,
        ]);
    }

    ResearchEntryLog::create([
        'modified_by' => $staff->id,
        'target_research_id' => $research->id,
        'action_type' => ResearchEntryLog::ACTION_POST,
    ]);

    $this->actingAs($staff)->getJson("/research/{$research->id}/status-history")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.action_type', ResearchEntryLog::ACTION_POST);
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

test('staff can edit draft research', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->draft()->create();

    $this->actingAs($staff)->get("/research/{$research->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('research/edit')
            ->has('programs')
            ->has('faculties')
            ->has('keywords')
            ->missing('keywordOptions')
            ->has('agendas')
            ->has('sdgs')
            ->has('srigs')
        );
});

test('students cannot edit linked research or use the removed review routes', function () {
    $student = User::factory()->asStudent()->create(['student_access_approved' => true]);
    $research = Research::factory()->draft()->create();
    $research->researchers()->create([
        'user_id' => $student->id,
        'first_name' => $student->first_name,
        'last_name' => $student->last_name,
        'email' => $student->email,
    ]);

    $this->actingAs($student)->put("/research/{$research->id}", [])->assertForbidden();
    $this->actingAs($student)->post("/research/{$research->id}/submit")->assertNotFound();
    $this->actingAs($student)->post("/research/{$research->id}/return")->assertNotFound();
});


test('withdraw route does not exist for research workflow', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->draft()->create();

    $response = $this->actingAs($staff)->post("/research/{$research->id}/withdraw");

    $response->assertStatus(404);
});
