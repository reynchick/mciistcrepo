<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('browse only shows published research items', function () {
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-VIS-1',
        'first_name' => 'Visible',
        'last_name' => 'Adviser',
    ]);

    $published = Research::factory()->published()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Visible Published Study',
        'published_year' => now()->year,
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
            ->where('researches.data.0.research_title', $published->research_title)
        );
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
