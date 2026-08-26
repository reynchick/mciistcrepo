<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function multiRoleResearchUser(Faculty $faculty): User
{
    $user = User::create([
        'first_name' => 'Multi',
        'last_name' => 'Role',
        'email' => 'multi-role@usep.edu.ph',
        'password' => Hash::make('password'),
        'faculty_id' => $faculty->faculty_id,
        'faculty_profile_completed' => true,
        'first_login_completed' => true,
    ]);

    foreach (['MCIIS Staff', 'Faculty'] as $name) {
        $role = Role::firstOrCreate(['name' => $name], ['description' => $name]);
        $user->roles()->attach($role);
    }

    return $user;
}

test('staff upload preserves the adviser selected in the form for a multi-role account', function () {
    $ownFaculty = Faculty::create(['faculty_id' => 'ADV-OWN-001', 'first_name' => 'Own', 'last_name' => 'Faculty', 'email' => 'own@usep.edu.ph']);
    $selectedFaculty = Faculty::create(['faculty_id' => 'ADV-SELECTED-001', 'first_name' => 'Selected', 'last_name' => 'Faculty', 'email' => 'selected@usep.edu.ph']);
    $program = Program::create(['name' => 'BS Computer Science', 'code' => 'BSCS']);
    $user = multiRoleResearchUser($ownFaculty);

    $this->withSession(['active_role' => 'MCIIS Staff'])->actingAs($user)->post('/research', [
        'workflow_action' => 'draft',
        'research_title' => 'Staff Selected Adviser Research',
        'program_id' => $program->id,
        'research_adviser' => $selectedFaculty->id,
    ])->assertSessionHasNoErrors();

    expect(\App\Models\Research::where('research_title', 'Staff Selected Adviser Research')->value('research_adviser'))
        ->toBe($selectedFaculty->id);
});

test('faculty upload still forces the authenticated faculty as adviser for a multi-role account', function () {
    $ownFaculty = Faculty::create(['faculty_id' => 'ADV-OWN-002', 'first_name' => 'Own', 'last_name' => 'Faculty', 'email' => 'own2@usep.edu.ph']);
    $selectedFaculty = Faculty::create(['faculty_id' => 'ADV-SELECTED-002', 'first_name' => 'Selected', 'last_name' => 'Faculty', 'email' => 'selected2@usep.edu.ph']);
    $program = Program::create(['name' => 'BS Information Technology', 'code' => 'BSIT']);
    $user = multiRoleResearchUser($ownFaculty);

    $this->withSession(['active_role' => 'Faculty'])->actingAs($user)->post('/research', [
        'workflow_action' => 'draft',
        'research_title' => 'Faculty Own Adviser Research',
        'program_id' => $program->id,
        'research_adviser' => $selectedFaculty->id,
    ])->assertSessionHasNoErrors();

    expect(\App\Models\Research::where('research_title', 'Faculty Own Adviser Research')->value('research_adviser'))
        ->toBe($ownFaculty->id);
});
