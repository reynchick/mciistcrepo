<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

test('staff can hard delete a draft research and preserve its log snapshot', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-HARD-1',
        'first_name' => 'Hard',
        'last_name' => 'Delete',
    ]);

    $research = Research::factory()->draft()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Draft Hard Delete Research',
    ]);
    $research->researchers()->delete();

    $response = $this->actingAs($staff)->delete("/research/{$research->id}/force", [
        'reason' => 'Draft cleanup',
        'confirmation' => 'DELETE',
    ]);

    $response->assertRedirect('/research');
    $this->assertDatabaseMissing('researches', ['id' => $research->id]);

    $log = ResearchEntryLog::query()
        ->where('action_type', ResearchEntryLog::ACTION_HARD_DELETE)
        ->latest('id')
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->target_research_id)->toBeNull()
        ->and($log->old_values['research_title'])->toBe('Draft Hard Delete Research')
        ->and($log->old_values['status'])->toBe(ResearchStatus::DRAFT->value)
        ->and($log->metadata['reason'])->toBe('Draft cleanup')
        ->and($log->metadata['researcher_count'])->toBe(0)
        ->and($log->metadata['file_count'])->toBe(0);
});

test('faculty cannot hard delete research', function () {
    $faculty = User::factory()->asFaculty()->create();
    $research = Research::factory()->draft()->create([
        'research_title' => 'Faculty Hard Delete Blocked',
    ]);

    $response = $this->actingAs($faculty)->delete("/research/{$research->id}/force", [
        'reason' => 'Attempt to delete',
        'confirmation' => 'DELETE',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('researches', ['id' => $research->id]);
});

test('staff can hard delete archived research after retention period', function () {
    Carbon::setTestNow(now()->subDays(366));

    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->create([
        'status' => ResearchStatus::ARCHIVED,
        'archived_at' => now()->subDays(366),
        'research_title' => 'Archived Retention Delete Research',
    ]);

    $response = $this->actingAs($staff)->delete("/research/{$research->id}/force", [
        'reason' => 'Retention cleanup',
        'confirmation' => 'DELETE',
    ]);

    $response->assertRedirect('/research');
    $this->assertDatabaseMissing('researches', ['id' => $research->id]);

    Carbon::setTestNow();
});
