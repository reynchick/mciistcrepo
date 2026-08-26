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

test('draft invited researcher editor saves corrections without sending mail or changing metadata', function () {
    Mail::fake();
    extract(createFacultyResearch());
    $research->update(['status' => ResearchStatus::DRAFT_INVITED]);
    $researcher = Researcher::create([
        'research_id' => $research->id,
        'first_name' => 'Existing', 'last_name' => 'Student',
        'email' => 'existing.student@usep.edu.ph',
    ]);
    $research->keywords()->sync([\App\Models\Keyword::create(['keyword_name' => 'Unchanged'])->id]);

    $response = $this->actingAs($facultyUser)->putJson("/research/{$research->id}/invited-researchers", [
        'updated_at' => $research->fresh()->updated_at?->toJSON(),
        'invitation_action' => 'save_only',
        'researchers' => [[
            'id' => $researcher->id, 'first_name' => 'Existing', 'last_name' => 'Student',
            'email' => 'corrected.student@usep.edu.ph',
        ]],
        // This must be ignored by the researcher-only endpoint.
        'research_title' => 'Attempted metadata change',
    ]);

    $response->assertOk()->assertJsonPath('data.invitation_emails_queued', 0);
    $this->assertDatabaseHas('researchers', ['id' => $researcher->id, 'email' => 'corrected.student@usep.edu.ph']);
    $this->assertDatabaseHas('researches', ['id' => $research->id, 'research_title' => $research->research_title, 'status' => ResearchStatus::DRAFT_INVITED]);
    $this->assertDatabaseHas('research_keywords', ['research_id' => $research->id]);
    Mail::assertNothingQueued();
});

test('draft invited researcher editor emails only corrected and newly added researchers', function () {
    Mail::fake();
    extract(createFacultyResearch());
    $research->update(['status' => ResearchStatus::DRAFT_INVITED]);
    $unchanged = Researcher::create(['research_id' => $research->id, 'first_name' => 'Unchanged', 'last_name' => 'Student', 'email' => 'unchanged.student@usep.edu.ph']);
    $changed = Researcher::create(['research_id' => $research->id, 'first_name' => 'Changed', 'last_name' => 'Student', 'email' => 'changed.student@usep.edu.ph']);

    $response = $this->actingAs($facultyUser)->putJson("/research/{$research->id}/invited-researchers", [
        'updated_at' => $research->fresh()->updated_at?->toJSON(),
        'invitation_action' => 'send_invitations',
        'researchers' => [
            ['id' => $unchanged->id, 'first_name' => 'Unchanged', 'last_name' => 'Student', 'email' => $unchanged->email],
            ['id' => $changed->id, 'first_name' => 'Changed', 'last_name' => 'Student', 'email' => 'corrected.student@usep.edu.ph'],
            ['first_name' => 'New', 'last_name' => 'Student', 'email' => 'new.student@usep.edu.ph'],
        ],
    ]);

    $response->assertOk()->assertJsonPath('data.invitation_emails_queued', 2);
    Mail::assertQueued(ResearcherInvitedMail::class, 2);
    Mail::assertQueued(ResearcherInvitedMail::class, fn ($mail) => $mail->researcher->email === 'corrected.student@usep.edu.ph');
    Mail::assertQueued(ResearcherInvitedMail::class, fn ($mail) => $mail->researcher->email === 'new.student@usep.edu.ph');
    Mail::assertNotQueued(ResearcherInvitedMail::class, fn ($mail) => $mail->researcher->email === $unchanged->email);
    expect($research->fresh()->status)->toBe(ResearchStatus::DRAFT_INVITED);
});

test('a non-adviser faculty member cannot access the draft invited researcher editor', function () {
    extract(createFacultyResearch());
    $research->update(['status' => ResearchStatus::DRAFT_INVITED]);
    $otherFacultyUser = User::factory()->asFaculty()->create(['faculty_id' => 'F-OTHER', 'faculty_profile_completed' => true]);
    Faculty::create(['faculty_id' => $otherFacultyUser->faculty_id, 'first_name' => 'Other', 'last_name' => 'Faculty']);

    $this->actingAs($otherFacultyUser)
        ->putJson("/research/{$research->id}/invited-researchers", ['invitation_action' => 'save_only', 'researchers' => []])
        ->assertForbidden();
});

test('draft invited researcher editor returns duplicate emails as a field validation error', function () {
    extract(createFacultyResearch());
    $research->update(['status' => ResearchStatus::DRAFT_INVITED]);
    $otherResearch = Research::factory()->create();
    Researcher::create([
        'research_id' => $otherResearch->id,
        'first_name' => 'Already', 'last_name' => 'Used', 'email' => 'taken.student@usep.edu.ph',
    ]);

    $this->actingAs($facultyUser)
        ->put("/research/{$research->id}/invited-researchers", [
            'invitation_action' => 'save_only',
            'researchers' => [[
                'first_name' => 'New', 'last_name' => 'Student', 'email' => 'taken.student@usep.edu.ph',
            ]],
        ])
        ->assertSessionHasErrors([
            'researchers.0.email' => 'This email is already used by another researcher.',
        ]);
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
