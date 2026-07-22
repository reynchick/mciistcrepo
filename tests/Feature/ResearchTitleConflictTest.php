<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('title uniqueness check returns false for active research titles', function () {
    $user = User::factory()->asAdministrator()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-TIT-1',
        'first_name' => 'Title',
        'last_name' => 'Conflict',
    ]);

    Research::factory()->published()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Existing Published Title',
        'published_year' => 2024,
    ]);

    $response = $this->actingAs($user)->get('/research/check-title?title=' . urlencode('Existing Published Title'));

    $response->assertOk()
        ->assertJson(['unique' => false]);
});

test('title uniqueness check returns true for archived research titles', function () {
    $user = User::factory()->asAdministrator()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-TIT-2',
        'first_name' => 'Title',
        'last_name' => 'Archived',
    ]);

    Research::factory()->create([
        'status' => ResearchStatus::ARCHIVED,
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Archived Title',
        'research_abstract' => 'This archived research has a reusable title check.',
        'published_year' => 2023,
    ]);

    $response = $this->actingAs($user)->get('/research/check-title?title=' . urlencode('Archived Title'));

    $response->assertOk()
        ->assertJson(['unique' => true]);
});
