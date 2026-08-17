<?php

use App\Mail\ProfileCompletionRequiredMail;
use App\Models\Faculty;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('the users table no longer stores the legacy shared profile_completed column', function () {
    expect(Schema::hasColumn('users', 'profile_completed'))->toBeFalse();
});

test('a saved student completion flag is treated as completed profile state', function () {
    $user = User::factory()->asStudent()->create([
        'student_profile_completed' => 1,
    ]);

    expect($user->needsStudentProfileCompletion())->toBeFalse();
});

test('a saved faculty completion flag is treated as completed profile state', function () {
    $user = User::factory()->asFaculty()->create([
        'faculty_profile_completed' => 1,
    ]);

    expect($user->needsFacultyProfileCompletion())->toBeFalse();
});

test('faculty profile completion redirects multi-role faculty and administrator users to the browse page', function () {
    $user = User::factory()->asFaculty()->create([
        'first_login_completed' => true,
        'faculty_profile_completed' => false,
        'faculty_id' => 'F00001',
    ]);

    $adminRole = Role::firstOrCreate(['name' => 'Administrator'], ['description' => 'Administrator']);
    $user->roles()->attach($adminRole->id);

    $response = $this
        ->actingAs($user)
        ->post(route('faculty.profile.complete.store'), [
            'first_name' => 'Test',
            'middle_name' => 'A.',
            'last_name' => 'User',
            'position' => 'Professor',
            'designation' => 'Instructor',
            'orcid' => '0000-0000-0000-0000',
            'contact_number' => '09123456789',
            'educational_attainment' => 'PhD',
            'field_of_specialization' => 'Computer Science',
            'research_interest' => 'AI',
        ]);

    $response->assertRedirect(route('browse'));
});

test('student profile completion redirects multi-role student and mciis staff users to the browse page', function () {
    $user = User::factory()->asStudent()->create([
        'first_login_completed' => true,
        'student_profile_completed' => false,
        'student_id' => null,
    ]);

    $staffRole = Role::firstOrCreate(['name' => 'MCIIS Staff'], ['description' => 'MCIIS Staff']);
    $user->roles()->attach($staffRole->id);

    $response = $this
        ->actingAs($user)
        ->post(route('student.profile.complete.store'), [
            'first_name' => 'Test',
            'middle_name' => 'A.',
            'last_name' => 'User',
            'student_id' => '2026-00001',
            'contact_number' => '09123456789',
        ]);

    $response->assertRedirect(route('browse'));
    $response->assertSessionHas('active_role', 'Student');
});

test('dashboard role priority can be configured for multi-role users', function () {
    config()->set('dashboard.role_priority', ['Faculty', 'MCIIS Staff', 'Administrator', 'Student']);

    $user = User::factory()->asAdministrator()->create([
        'first_login_completed' => true,
    ]);

    $staffRole = Role::firstOrCreate(['name' => 'MCIIS Staff'], ['description' => 'MCIIS Staff']);
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    $user->roles()->attach([$staffRole->id, $facultyRole->id]);

    expect($user->dashboardRoleName())->toBe('Faculty');
    expect($user->dashboardRoute())->toBe('faculty.dashboard');
});

test('administrators with extra roles use the admin dashboard route', function () {
    $user = User::factory()->asAdministrator()->create([
        'first_login_completed' => true,
    ]);

    $facultyRole = Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    $user->roles()->attach($facultyRole->id);

    expect($user->dashboardRoute())->toBe('dashboard');
});

test('a previously completed faculty profile remains completed when the faculty role is removed and added again', function () {
    Mail::fake();

    $admin = User::factory()->asAdministrator()->create([
        'first_login_completed' => true,
    ]);

    $faculty = Faculty::create([
        'faculty_id' => 'F00001',
        'first_name' => 'Test',
        'middle_name' => 'A.',
        'last_name' => 'Faculty',
        'position' => 'Professor',
        'designation' => 'Instructor',
        'email' => 'faculty-member@usep.edu.ph',
    ]);

    $user = User::factory()->asFaculty()->create([
        'first_login_completed' => true,
        'faculty_profile_completed' => true,
        'faculty_id' => $faculty->faculty_id,
        'email' => $faculty->email,
    ]);

    Role::firstOrCreate(['name' => 'MCIIS Staff'], ['description' => 'MCIIS Staff']);
    Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    $staffRoleId = Role::where('name', 'MCIIS Staff')->value('id');
    $facultyRoleId = Role::where('name', 'Faculty')->value('id');

    $this
        ->actingAs($admin)
        ->patch(route('users.update', $user), [
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'contact_number' => '09123456789',
            'email' => $faculty->email,
            'role_ids' => [$staffRoleId],
        ]);

    $this
        ->actingAs($admin)
        ->patch(route('users.update', $user), [
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'contact_number' => '09123456789',
            'email' => $faculty->email,
            'role_ids' => [$facultyRoleId],
        ]);

    $user->refresh();

    expect($user->roles->pluck('name'))->toContain('Faculty');
    expect($user->faculty_profile_completed)->toBeTrue();
    Mail::assertNothingSent();
});

test('changing a user to a faculty or student role requires profile completion and sends an email', function () {
    Mail::fake();

    $admin = User::factory()->asAdministrator()->create([
        'first_login_completed' => true,
    ]);

    $user = User::factory()->asMCIISStaff()->create([
        'first_login_completed' => true,
    ]);

    Role::firstOrCreate(['name' => 'Student'], ['description' => 'Student']);
    $studentRoleId = Role::where('name', 'Student')->value('id');

    $response = $this
        ->actingAs($admin)
        ->patch(route('users.update', $user), [
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'contact_number' => '09123456789',
            'email' => 'updated-' . $user->email,
            'role_ids' => [$studentRoleId],
            'student_id' => '2026-00001',
        ]);

    $response->assertRedirect(route('users.index'));

    $user->refresh();

    expect($user->student_profile_completed)->toBeFalse();
    expect($user->roles->pluck('name'))->toContain('Student');

    Mail::assertSent(ProfileCompletionRequiredMail::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});

test('a user cannot be assigned both Faculty and Student roles at the same time', function () {
    $admin = User::factory()->asAdministrator()->create([
        'first_login_completed' => true,
    ]);

    $user = User::factory()->withoutRoles()->create([
        'first_login_completed' => true,
    ]);

    // Ensure roles exist for the test
    Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    Role::firstOrCreate(['name' => 'Student'], ['description' => 'Student']);
    $facultyRoleId = Role::where('name', 'Faculty')->value('id');
    $studentRoleId = Role::where('name', 'Student')->value('id');

    $response = $this
        ->actingAs($admin)
        ->patch(route('users.update', $user), [
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'role_ids' => [$facultyRoleId, $studentRoleId],
            'faculty_id' => 'F00001',
            'student_id' => '2026-00001',
        ]);

    $response->assertStatus(302);
    $response->assertSessionHasErrors([
        'role_ids' => 'A user may not have both Faculty and Student roles.',
    ]);

    $user->refresh();
    expect($user->roles->pluck('name'))->not->toContain('Faculty');
    expect($user->roles->pluck('name'))->not->toContain('Student');
});

test('admin cannot create a user with both Faculty and Student roles', function () {
    $admin = User::factory()->asAdministrator()->create([
        'first_login_completed' => true,
    ]);

    $facultyRole = \App\Models\Role::firstOrCreate([
        'name' => 'Faculty',
    ], [
        'description' => 'Faculty',
    ]);

    $studentRole = \App\Models\Role::firstOrCreate([
        'name' => 'Student',
    ], [
        'description' => 'Student',
    ]);

    $faculty = \App\Models\Faculty::create([
        'faculty_id' => 'F00001',
        'first_name' => 'Faculty',
        'middle_name' => 'A.',
        'last_name' => 'Member',
        'position' => 'Professor',
        'designation' => 'Instructor',
        'email' => 'faculty-member@usep.edu.ph',
    ]);

    $response = $this
        ->actingAs($admin)
        ->post(route('users.store'), [
            'first_name' => 'Test',
            'middle_name' => 'A.',
            'last_name' => 'User',
            'contact_number' => '09123456789',
            'email' => $faculty->email,
            'role_ids' => [$facultyRole->id, $studentRole->id],
            'faculty_id' => $faculty->faculty_id,
            'student_id' => '2026-00001',
        ]);

    $response->assertStatus(302);
    $response->assertSessionHasErrors('role_ids');
});
