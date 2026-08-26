<?php

use App\Models\Program;
use App\Models\Research;
use App\Models\Researcher;
use App\Models\User;
use App\Models\UserAuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('users and shared Inertia props never expose credentials', function () {
    $admin = User::factory()->asAdministrator()->create([
        'password' => Hash::make('exposed-password'),
        'remember_token' => 'persistent-login-token',
        'google_id' => 'google-account-id',
    ]);

    $response = $this->actingAs($admin)->get('/users');

    $response->assertOk();
    expect($response->getContent())
        ->not->toContain($admin->password)
        ->not->toContain('persistent-login-token')
        ->not->toContain('google-account-id');
});

test('log responses exclude audit credentials and request fingerprints', function () {
    $admin = User::factory()->asAdministrator()->create();
    $target = User::factory()->create();
    $log = UserAuditLog::factory()->create([
        'modified_by' => $admin->id,
        'target_user_id' => $target->id,
        'old_values' => ['email' => 'old@example.test', 'password' => 'old-hash', 'remember_token' => 'old-token'],
        'new_values' => ['email' => 'new@example.test', 'password' => 'new-hash', 'google_id' => 'oauth-id'],
        'metadata' => ['note' => 'safe note', 'token' => 'hidden-token'],
        'ip_address' => '203.0.113.10',
        'user_agent' => 'Sensitive Test Agent',
    ]);

    $list = $this->actingAs($admin)->get('/logs/user-audit');
    $detail = $this->actingAs($admin)->getJson("/logs/user-audit/{$log->id}/details");

    $list->assertOk();
    $detail->assertOk();
    foreach ([$list, $detail] as $response) {
        expect($response->getContent())
            ->not->toContain('old-hash')
            ->not->toContain('new-hash')
            ->not->toContain('old-token')
            ->not->toContain('oauth-id')
            ->not->toContain('hidden-token')
            ->not->toContain('203.0.113.10')
            ->not->toContain('Sensitive Test Agent');
    }
});

test('public browse data excludes researcher emails and stored file paths', function () {
    $program = Program::factory()->create();
    $research = Research::factory()->posted()->create([
        'program_id' => $program->id,
        'research_manuscript' => 'research/manuscripts/private.pdf',
        'research_approval_sheet' => 'research/approval_sheets/private.pdf',
    ]);
    Researcher::create([
        'research_id' => $research->id,
        'first_name' => 'Public',
        'last_name' => 'Researcher',
        'email' => 'researcher@example.test',
    ]);

    $response = $this->get('/browse');

    $response->assertOk();
    expect($response->getContent())
        ->not->toContain('researcher@example.test')
        ->not->toContain('research/manuscripts/private.pdf')
        ->not->toContain('research/approval_sheets/private.pdf');
});

test('student draft-save JSON returns only a safe research summary', function () {
    $student = User::factory()->asStudent()->create(['student_profile_completed' => true]);
    $program = Program::factory()->create();
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'status' => 'draft_invited',
        'student_collaboration_enabled' => true,
        'research_manuscript' => 'research/manuscripts/private.pdf',
        'research_approval_sheet' => 'research/approval_sheets/private.pdf',
    ]);
    $researcher = Researcher::create([
        'research_id' => $research->id,
        'user_id' => $student->id,
        'first_name' => $student->first_name,
        'last_name' => $student->last_name,
        'email' => $student->email,
        'is_lead_author' => true,
    ]);

    $response = $this->actingAs($student)->putJson("/research/{$research->id}", [
        'research_title' => $research->research_title,
        'program_id' => $program->id,
        'status' => 'draft_invited',
        'workflow_action' => 'draft',
        'researchers' => [[
            'id' => $researcher->id,
            'first_name' => $researcher->first_name,
            'last_name' => $researcher->last_name,
            'email' => $researcher->email,
            'is_lead_author' => true,
        ]],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.research.id', $research->id)
        ->assertJsonMissingPath('data.research.research_manuscript')
        ->assertJsonMissingPath('data.research.research_approval_sheet');
});
