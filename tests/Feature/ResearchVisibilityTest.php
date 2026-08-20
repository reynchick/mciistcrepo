<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('browse only shows posted research items', function () {
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-VIS-1',
        'first_name' => 'Visible',
        'last_name' => 'Adviser',
    ]);

    $posted = Research::factory()->posted()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Visible Posted Study',
        'completed_year' => now()->year,
    ]);

    Research::factory()->draft()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Hidden Draft Study',
    ]);

    $response = $this->get('/browse');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('researches.data', 1)
            ->where('researches.data.0.research_title', $posted->research_title)
        );
});

test('posted research details endpoint returns its payload', function () {
    $research = Research::factory()->posted()->create([
        'research_title' => 'Posted Details Payload',
    ]);

    $this->getJson("/research/{$research->id}/details")
        ->assertOk()
        ->assertJsonPath('data.id', $research->id)
        ->assertJsonPath('data.research_title', 'Posted Details Payload')
        ->assertJsonPath('data.can_download_files', false);
});

test('student receives forbidden when viewing draft research details', function () {
    $student = User::factory()->asStudent()->create([
        'student_profile_completed' => true,
    ]);
    $research = Research::factory()->draft()->create([
        'research_title' => 'Student Draft Access Check',
    ]);

    $response = $this->actingAs($student)->get("/research/{$research->id}/details");

    $response->assertForbidden();
});
