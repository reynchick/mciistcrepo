<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('report index filters research by program, year, and status', function () {
    $admin = User::factory()->asAdministrator()->create();
    $programA = Program::factory()->create(['name' => 'BS Information Technology']);
    $programB = Program::factory()->create(['name' => 'BS Computer Science']);
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-REP-1',
        'first_name' => 'Report',
        'last_name' => 'Adviser',
    ]);

    Research::factory()->published()->create([
        'program_id' => $programA->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Published Report Research',
        'published_year' => 2024,
    ]);

    Research::factory()->published()->create([
        'program_id' => $programB->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Other Program Research',
        'published_year' => 2024,
    ]);

    Research::factory()->draft()->create([
        'program_id' => $programA->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Draft Report Research',
        'published_year' => 2024,
    ]);

    $response = $this->actingAs($admin)->get('/reports?program=' . $programA->id . '&year=2024&status_filter=published');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('records', 1)
            ->where('records.0.research_title', 'Published Report Research')
        );
});

test('compilation export respects status and program filters', function () {
    $admin = User::factory()->asAdministrator()->create();
    $program = Program::factory()->create(['name' => 'BS Information Technology']);
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-REP-2',
        'first_name' => 'Compilation',
        'last_name' => 'Adviser',
    ]);

    Research::factory()->published()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Compilation Export Research',
        'published_year' => 2025,
    ]);

    $response = $this->actingAs($admin)->get('/reports/export-compilation?status_filter=published&program=' . $program->id . '&year=2025&adviser=' . $adviser->id);

    $response->assertOk();
    $response->assertHeader('content-disposition');
});
