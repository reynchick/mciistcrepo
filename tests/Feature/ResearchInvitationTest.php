<?php

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\ResearcherInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

test('changing a researcher email revokes the existing invitation and issues a new one', function () {
    Mail::fake();

    $staff = User::factory()->asMCIISStaff()->create();
    $program = Program::factory()->create();
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-INV-1',
        'first_name' => 'Invitation',
        'last_name' => 'Adviser',
    ]);

    $research = Research::factory()->create([
        'status' => ResearchStatus::SUBMITTED,
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Invitation Email Change Research',
        'research_abstract' => 'Research used to verify invitation token revocation.',
        'published_year' => now()->year,
    ]);

    $researcher = $research->researchers()->create([
        'first_name' => 'Original',
        'last_name' => 'Researcher',
        'email' => 'original.researcher@usep.edu.ph',
        'is_lead_author' => true,
    ]);

    $existingInvitation = ResearcherInvitation::create([
        'researcher_id' => $researcher->id,
        'token_hash' => Hash::make('original-token'),
        'email_snapshot' => $researcher->email,
        'expires_at' => now()->addDays(7),
    ]);

    $response = $this->actingAs($staff)->put("/research/{$research->id}", [
        'research_title' => $research->research_title,
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'published_year' => $research->published_year,
        'research_abstract' => $research->research_abstract,
        'keywords' => ['InvitationKeyword'],
        'researchers' => [[
            'id' => $researcher->id,
            'first_name' => 'Original',
            'last_name' => 'Researcher',
            'email' => 'updated.researcher@usep.edu.ph',
            'is_lead_author' => true,
        ]],
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('researcher_invitations', [
        'id' => $existingInvitation->id,
    ]);
    $this->assertNotNull(ResearcherInvitation::find($existingInvitation->id)->revoked_at);

    $this->assertDatabaseHas('researcher_invitations', [
        'researcher_id' => $researcher->id,
        'email_snapshot' => 'updated.researcher@usep.edu.ph',
        'accepted_at' => null,
    ]);
});

test('invalid invitation tokens render the invalid invitation page', function () {
    $user = User::factory()->asAdministrator()->create();

    $response = $this->actingAs($user)->get('/research/invitation/this-token-does-not-exist');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('research/invitation-invalid')
        );
});
