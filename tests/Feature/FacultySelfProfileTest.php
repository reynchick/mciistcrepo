<?php

use App\Models\Faculty;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function facultyProfileUser(Faculty $faculty): User
{
    $user = User::create([
        'first_name' => $faculty->first_name,
        'last_name' => $faculty->last_name,
        'email' => $faculty->email,
        'password' => Hash::make('password'),
        'faculty_id' => $faculty->faculty_id,
        'faculty_profile_completed' => true,
    ]);
    $role = Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    $user->roles()->attach($role);

    return $user;
}

test('faculty can update only their own profile fields', function () {
    $faculty = Faculty::create([
        'faculty_id' => 'FAC-SELF-001',
        'first_name' => 'Ada',
        'last_name' => 'Lovelace',
        'email' => 'ada@usep.edu.ph',
    ]);
    $user = facultyProfileUser($faculty);

    $this->withSession(['active_role' => 'Faculty'])->actingAs($user)->put('/faculty/my-profile', [
        'first_name' => 'Augusta',
        'last_name' => 'Lovelace',
        'contact_number' => '09171234567',
        'position' => 'Professor',
        'designation' => 'Program Coordinator',
        'orcid' => '0000-0000-0000-0000',
        'educational_attainment' => 'PhD',
        'field_of_specialization' => 'Computer Science',
        'research_interest' => 'Computing education',
    ])->assertRedirect("/faculty/{$faculty->id}");

    $faculty->refresh();
    expect($faculty->first_name)->toBe('Augusta')
        ->and($faculty->contact_number)->toBe('09171234567')
        ->and($faculty->email)->toBe('ada@usep.edu.ph')
        ->and($faculty->faculty_id)->toBe('FAC-SELF-001');
});

test('faculty cannot update another faculty profile by manipulating the URL', function () {
    $ownFaculty = Faculty::create([
        'faculty_id' => 'FAC-SELF-002',
        'first_name' => 'Grace',
        'last_name' => 'Hopper',
        'email' => 'grace@usep.edu.ph',
    ]);
    $otherFaculty = Faculty::create([
        'faculty_id' => 'FAC-OTHER-001',
        'first_name' => 'Katherine',
        'last_name' => 'Johnson',
        'email' => 'katherine@usep.edu.ph',
    ]);
    $user = facultyProfileUser($ownFaculty);

    $this->withSession(['active_role' => 'Faculty'])->actingAs($user)->put("/faculty/{$otherFaculty->id}", [
        'first_name' => 'Changed',
        'last_name' => $otherFaculty->last_name,
    ])->assertForbidden();
});

test('faculty self-edit rejects faculty ID and email changes', function () {
    $faculty = Faculty::create([
        'faculty_id' => 'FAC-SELF-003',
        'first_name' => 'Marie',
        'last_name' => 'Curie',
        'email' => 'marie@usep.edu.ph',
    ]);
    $user = facultyProfileUser($faculty);

    $this->withSession(['active_role' => 'Faculty'])->actingAs($user)->put('/faculty/my-profile', [
        'faculty_id' => 'FAC-CHANGED',
        'email' => 'changed@usep.edu.ph',
        'first_name' => $faculty->first_name,
        'last_name' => $faculty->last_name,
    ])->assertSessionHasErrors(['faculty_id', 'email']);
});
