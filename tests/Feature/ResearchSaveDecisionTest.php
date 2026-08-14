<?php

use App\Enums\ResearchStatus;
use App\Mail\ResearcherInvitedMail;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\Researcher;
use App\Models\ResearcherInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function createFacultyResearch(): array
{
    $program = Program::factory()->create();

    $facultyUser = User::factory()->asFaculty()->create([
        'faculty_id' => 'F-SAVE-DECISION',
        'faculty_profile_completed' => true,
    ]);

    $faculty = Faculty::create([
        'faculty_id' => $facultyUser->faculty_id,
        'first_name' => 'Faculty',
        'last_name' => 'Member',
    ]);

    $research = Research::factory()->create([
        'uploaded_by' => $facultyUser->id,
        'research_adviser' => $faculty->id,
        'program_id' => $program->id,
        'status' => ResearchStatus::DRAFT,
        'student_collaboration_enabled' => true,
    ]);

    return compact('facultyUser', 'faculty', 'program', 'research');
}

test('previewing research save returns a decision_required summary without writing', function () {
    extract(createFacultyResearch());

    $response = $this->actingAs($facultyUser)
        ->putJson("/research/{$research->id}", [
            'research_title' => $research->research_title,
            'program_id' => $program->id,
            'research_adviser' => $faculty->id,
            'completed_year' => now()->year,
            'research_abstract' => 'Preview summary test.',
            'keywords' => ['Save Decision'],
            'panelists' => [],
            'researchers' => [
                [
                    'id' => null,
                    'first_name' => 'New',
                    'middle_name' => null,
                    'last_name' => 'Researcher',
                    'email' => 'new.researcher@usep.edu.ph',
                    'is_lead_author' => true,
                ],
            ],
        ]);

    $response->assertOk();
    $response->assertJson([ 
        'invitation_decision_required' => true,
        'removal_only' => false,
    ]);

    $this->assertDatabaseMissing('researchers', [
        'research_id' => $research->id,
        'email' => 'new.researcher@usep.edu.ph',
    ]);
});

test('save_only updates changes without sending invitation email', function () {
    Mail::fake();

    extract(createFacultyResearch());

    $researcher = Researcher::create([
        'research_id' => $research->id,
        'first_name' => 'Existing',
        'last_name' => 'Student',
        'email' => 'existing.student@usep.edu.ph',
        'is_lead_author' => true,
    ]);

    ResearcherInvitation::create([
        'researcher_id' => $researcher->id,
        'token_hash' => Hash::make('original-token'),
        'email_snapshot' => $researcher->email,
        'expires_at' => now()->addDays(7),
    ]);

    $response = $this->actingAs($facultyUser)
        ->putJson("/research/{$research->id}", [
            'research_title' => $research->research_title,
            'program_id' => $program->id,
            'research_adviser' => $faculty->id,
            'completed_year' => now()->year,
            'research_abstract' => 'Save only test.',
            'keywords' => ['Save Decision'],
            'panelists' => [],
            'researchers' => [
                [
                    'id' => $researcher->id,
                    'first_name' => 'Existing',
                    'middle_name' => null,
                    'last_name' => 'Student',
                    'email' => 'updated.student@usep.edu.ph',
                    'is_lead_author' => true,
                ],
            ],
            'invitation_action' => 'save_only',
            'updated_at' => $research->updated_at?->toJSON(),
        ]);

    $response->assertOk();
    $response->assertJsonPath('data.invitation_emails_queued', 0);

    $this->assertDatabaseHas('researchers', [
        'id' => $researcher->id,
        'email' => 'updated.student@usep.edu.ph',
    ]);

    $this->assertDatabaseHas('researcher_invitations', [
        'researcher_id' => $researcher->id,
    ]);
    $this->assertNotNull(ResearcherInvitation::where('researcher_id', $researcher->id)->value('revoked_at'));

    Mail::assertNothingQueued();
});

test('send_invitations commits changes and queues invitation email', function () {
    Mail::fake();

    extract(createFacultyResearch());

    $researcher = Researcher::create([
        'research_id' => $research->id,
        'first_name' => 'Existing',
        'last_name' => 'Student',
        'email' => 'existing.student@usep.edu.ph',
        'is_lead_author' => true,
    ]);

    $response = $this->actingAs($facultyUser)
        ->putJson("/research/{$research->id}", [
            'research_title' => $research->research_title,
            'program_id' => $program->id,
            'research_adviser' => $faculty->id,
            'completed_year' => now()->year,
            'research_abstract' => 'Send invitations test.',
            'keywords' => ['Save Decision'],
            'panelists' => [],
            'researchers' => [
                [
                    'id' => $researcher->id,
                    'first_name' => 'Existing',
                    'middle_name' => null,
                    'last_name' => 'Student',
                    'email' => 'updated.student@usep.edu.ph',
                    'is_lead_author' => true,
                ],
            ],
            'invitation_action' => 'send_invitations',
            'updated_at' => $research->updated_at?->toJSON(),
        ]);

    $response->assertOk();
    $response->assertJsonPath('data.invitation_emails_queued', 1);

    $this->assertDatabaseHas('researchers', [
        'id' => $researcher->id,
        'email' => 'updated.student@usep.edu.ph',
    ]);
    $this->assertDatabaseHas('researcher_invitations', [
        'researcher_id' => $researcher->id,
        'email_snapshot' => 'updated.student@usep.edu.ph',
        'accepted_at' => null,
    ]);

    Mail::assertQueued(ResearcherInvitedMail::class, 1);
});

test('removal_only save preview returns removal confirmation without invitations', function () {
    extract(createFacultyResearch());

    $first = Researcher::create([
        'research_id' => $research->id,
        'first_name' => 'First',
        'last_name' => 'Student',
        'email' => 'first.student@usep.edu.ph',
        'is_lead_author' => true,
    ]);

    $second = Researcher::create([
        'research_id' => $research->id,
        'first_name' => 'Second',
        'last_name' => 'Student',
        'email' => 'second.student@usep.edu.ph',
        'is_lead_author' => false,
    ]);

    $response = $this->actingAs($facultyUser)
        ->putJson("/research/{$research->id}", [
            'research_title' => $research->research_title,
            'program_id' => $program->id,
            'research_adviser' => $faculty->id,
            'completed_year' => now()->year,
            'research_abstract' => 'Removal only test.',
            'keywords' => ['Save Decision'],
            'panelists' => [],
            'researchers' => [
                [
                    'id' => $second->id,
                    'first_name' => 'Second',
                    'middle_name' => null,
                    'last_name' => 'Student',
                    'email' => 'second.student@usep.edu.ph',
                    'is_lead_author' => false,
                ],
            ],
        ]);

    $response->assertOk();
    $response->assertJson([ 
        'invitation_decision_required' => true,
        'removal_only' => true,
    ]);
    expect(collect($response->json('summary.removed'))->pluck('researcher_id')->all())->toContain($first->id);
});

test('version conflict on confirmed save returns an updated_at validation error', function () {
    extract(createFacultyResearch());

    $researcher = Researcher::create([
        'research_id' => $research->id,
        'first_name' => 'Existing',
        'last_name' => 'Student',
        'email' => 'existing.student@usep.edu.ph',
        'is_lead_author' => true,
    ]);

    $oldUpdatedAt = $research->updated_at?->copy()->subSecond()->toJSON();
    $research->forceFill(['research_abstract' => 'Changed externally.'])->save();

    $response = $this->actingAs($facultyUser)
        ->putJson("/research/{$research->id}", [
            'research_title' => $research->research_title,
            'program_id' => $program->id,
            'research_adviser' => $faculty->id,
            'completed_year' => now()->year,
            'research_abstract' => 'Version conflict test.',
            'keywords' => ['Save Decision'],
            'panelists' => [],
            'researchers' => [
                [
                    'id' => $researcher->id,
                    'first_name' => 'Existing',
                    'middle_name' => null,
                    'last_name' => 'Student',
                    'email' => 'existing.student@usep.edu.ph',
                    'is_lead_author' => true,
                ],
            ],
            'invitation_action' => 'save_only',
            'updated_at' => $oldUpdatedAt,
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('updated_at');
});
