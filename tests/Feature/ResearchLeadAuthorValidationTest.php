<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function leadAuthorTestPayload(Program $program, Faculty $adviser, array $researchers): array
{
    return [
        'research_title' => 'Lead Author Test ' . uniqid(),
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'completed_year' => 2025,
        'research_abstract' => 'A valid abstract for lead-author validation testing.',
        'researchers' => $researchers,
        'keywords' => ['LeadAuthorTest'],
    ];
}

function leadAuthorTestResearchers(int $leadAuthors): array
{
    return [
        [
            'first_name' => 'Alice',
            'last_name' => 'Author',
            'email' => 'alice.' . uniqid() . '@usep.edu.ph',
            'is_lead_author' => $leadAuthors >= 1,
        ],
        [
            'first_name' => 'Bob',
            'last_name' => 'Author',
            'email' => 'bob.' . uniqid() . '@usep.edu.ph',
            'is_lead_author' => $leadAuthors >= 2,
        ],
    ];
}

function leadAuthorTestSetup(): array
{
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'LEAD-ADV-' . uniqid(),
        'first_name' => 'Test',
        'last_name' => 'Adviser',
    ]);

    return compact('staff', 'program', 'adviser');
}

test('research can be created with no lead author', function () {
    ['staff' => $staff, 'program' => $program, 'adviser' => $adviser] = leadAuthorTestSetup();

    $this->actingAs($staff)
        ->post('/research', leadAuthorTestPayload($program, $adviser, leadAuthorTestResearchers(0)))
        ->assertSessionHasNoErrors();
});

test('research can be created with one lead author', function () {
    ['staff' => $staff, 'program' => $program, 'adviser' => $adviser] = leadAuthorTestSetup();

    $this->actingAs($staff)
        ->post('/research', leadAuthorTestPayload($program, $adviser, leadAuthorTestResearchers(1)))
        ->assertSessionHasNoErrors();
});

test('research cannot be created with more than one lead author', function () {
    ['staff' => $staff, 'program' => $program, 'adviser' => $adviser] = leadAuthorTestSetup();

    $this->actingAs($staff)
        ->post('/research', leadAuthorTestPayload($program, $adviser, leadAuthorTestResearchers(2)))
        ->assertSessionHasErrors(['researchers']);
});

test('research can be updated with no lead author', function () {
    ['staff' => $staff, 'program' => $program, 'adviser' => $adviser] = leadAuthorTestSetup();

    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
    ]);

    $this->actingAs($staff)
        ->put("/research/{$research->id}", leadAuthorTestPayload($program, $adviser, leadAuthorTestResearchers(0)))
        ->assertSessionHasNoErrors();
});

test('research cannot be updated with more than one lead author', function () {
    ['staff' => $staff, 'program' => $program, 'adviser' => $adviser] = leadAuthorTestSetup();

    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
    ]);

    $this->actingAs($staff)
        ->put("/research/{$research->id}", leadAuthorTestPayload($program, $adviser, leadAuthorTestResearchers(2)))
        ->assertSessionHasErrors(['researchers']);
});