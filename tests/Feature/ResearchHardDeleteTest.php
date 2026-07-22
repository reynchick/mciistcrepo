<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('staff can hard delete draft research', function () {
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

    $response = $this->actingAs($staff)->delete("/research/{$research->id}/force", [
        'reason' => 'Draft cleanup',
    ]);

    $response->assertRedirect('/research');
    $this->assertDatabaseMissing('researches', ['id' => $research->id]);
});

test('staff cannot hard delete published research', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->published()->create([
        'research_title' => 'Published Hard Delete Blocked Research',
    ]);

    $response = $this->actingAs($staff)->delete("/research/{$research->id}/force", [
        'reason' => 'Attempt to delete published research',
    ]);

    $response->assertStatus(403);
    $this->assertDatabaseHas('researches', ['id' => $research->id]);
});
