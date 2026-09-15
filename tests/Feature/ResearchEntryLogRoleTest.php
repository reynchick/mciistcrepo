<?php

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('stores and returns the role active for each research action', function () {
    $studentRole = Role::create(['name' => 'Student']);
    $facultyRole = Role::create(['name' => 'Faculty']);
    $staffRole = Role::create(['name' => 'MCIIS Staff']);

    $ivan = User::factory()->create(['first_name' => 'Ivan', 'last_name' => 'Pavo']);
    $ivan->roles()->attach($studentRole);

    $hobert = User::factory()->create(['first_name' => 'Hobert', 'last_name' => 'Actor']);
    $hobert->roles()->attach([$facultyRole->id, $staffRole->id]);

    $research = Research::factory()->posted()->create();

    session(['active_role' => 'Student']);
    $ivanLog = ResearchEntryLog::factory()->create([
        'modified_by' => $ivan->id,
        'target_research_id' => $research->id,
    ]);

    session(['active_role' => 'Faculty']);
    $facultyLog = ResearchEntryLog::factory()->create([
        'modified_by' => $hobert->id,
        'target_research_id' => $research->id,
    ]);

    session(['active_role' => 'Staff']);
    $staffLog = ResearchEntryLog::factory()->create([
        'modified_by' => $hobert->id,
        'target_research_id' => $research->id,
    ]);

    expect($ivanLog->fresh()->metadata['actor_snapshot']['role'])->toBe('Student')
        ->and($facultyLog->fresh()->metadata['actor_snapshot']['role'])->toBe('Faculty')
        ->and($staffLog->fresh()->metadata['actor_snapshot']['role'])->toBe('Staff');

    expect($research->researchEntryLogsTargeting()->get()->map(
        fn (ResearchEntryLog $log) => data_get($log->metadata, 'actor_snapshot.role')
    ))->toContain('Student')->toContain('Faculty')->toContain('Staff');
});
