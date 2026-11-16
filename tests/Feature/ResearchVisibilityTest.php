<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\Role;
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
        ->assertJsonPath('data.status', ResearchStatus::POSTED->value)
        ->assertJsonPath('data.has_manuscript', false)
        ->assertJsonMissingPath('data.research_manuscript');
});

test('staff research details payload exposes the real non-public workflow status', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->create(['status' => ResearchStatus::DRAFT]);

    $this->actingAs($staff)->getJson("/research/{$research->id}/details")
        ->assertOk()
        ->assertJsonPath('data.status', ResearchStatus::DRAFT->value);
});

test('students cannot view non-posted research even when linked as a researcher', function () {
    $student = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);

    foreach ([ResearchStatus::DRAFT, ResearchStatus::SUBMITTED, ResearchStatus::RETURNED] as $status) {
        $research = Research::factory()->create([
            'status' => $status,
            'research_title' => "Hidden {$status->value} Research",
        ]);
        $research->researchers()->create([
            'user_id' => $student->id,
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'email' => $student->email,
        ]);

        $this->actingAs($student)
            ->get("/research/{$research->id}/details")
            ->assertForbidden();
    }
});

test('student my researches only includes posted linked research', function () {
    $student = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);

    foreach ([ResearchStatus::DRAFT, ResearchStatus::SUBMITTED, ResearchStatus::RETURNED, ResearchStatus::POSTED] as $status) {
        $research = Research::factory()->create([
            'status' => $status,
            'research_title' => "Linked {$status->value} Research",
        ]);
        $research->researchers()->create([
            'user_id' => $student->id,
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'email' => $student->email,
        ]);
    }

    $this->actingAs($student)->get('/student/my-researches')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('researches', 1)
            ->where('researches.0.status', ResearchStatus::POSTED->value)
        );
});

test('download permission in research details follows the active role', function () {
    $research = Research::factory()->posted()->create([
        'program_id' => Program::factory()->create()->id,
    ]);
    $user = User::factory()->asStudent()->create([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
        'faculty_profile_completed' => true,
    ]);
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    $user->roles()->syncWithoutDetaching([$facultyRole->id]);

    $this->actingAs($user)
        ->withSession(['active_role' => 'Student'])
        ->getJson("/research/{$research->id}/details")
        ->assertOk()
        ->assertJsonPath('data.can_download_files', false);

    $this->actingAs($user)
        ->withSession(['active_role' => 'Faculty'])
        ->getJson("/research/{$research->id}/details")
        ->assertOk()
        ->assertJsonPath('data.can_download_files', true);
});
