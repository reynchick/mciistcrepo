<?php

use App\Models\Faculty;
use App\Models\Role;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('profile page is displayed', function () {
    $user = User::factory()->withoutRoles()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->withoutRoles()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'first_name' => 'Test',
            'middle_name' => 'M',
            'last_name' => 'User',
            'contact_number' => '09123456789',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->first_name)->toBe('Test');
    expect($user->last_name)->toBe('User');
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->withoutRoles()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'first_name' => 'Test',
            'middle_name' => 'M',
            'last_name' => 'User',
            'contact_number' => '09123456789',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('faculty profile details can be updated from settings', function () {
    $faculty = Faculty::create([
        'faculty_id' => 'F-1001',
        'first_name' => 'Old',
        'middle_name' => 'M',
        'last_name' => 'Name',
        'position' => 'Instructor',
        'designation' => 'Department Staff',
        'email' => 'faculty@example.com',
    ]);

    $user = User::factory()->asFaculty()->create([
        'profile_completed' => true,
        'faculty_id' => $faculty->faculty_id,
        'first_name' => 'Old',
        'middle_name' => 'M',
        'last_name' => 'Name',
    ]);

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'first_name' => 'New',
            'middle_name' => 'M.',
            'last_name' => 'Faculty',
            'contact_number' => '09123456789',
            'position' => 'Assistant Professor',
            'designation' => 'Department Chair',
            'orcid' => '0000-0002-1825-0097',
            'educational_attainment' => 'PhD',
            'field_of_specialization' => 'Artificial Intelligence',
            'research_interest' => 'Machine Learning',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();
    $faculty->refresh();

    expect($user->first_name)->toBe('New');
    expect($user->last_name)->toBe('Faculty');
    expect($faculty->position)->toBe('Assistant Professor');
    expect($faculty->designation)->toBe('Department Chair');
    expect($faculty->orcid)->toBe('0000-0002-1825-0097');
    expect($faculty->educational_attainment)->toBe('PhD');
    expect($faculty->field_of_specialization)->toBe('Artificial Intelligence');
    expect($faculty->research_interest)->toBe('Machine Learning');
});

test('user can switch to a different active role', function () {
    $user = User::factory()->withoutRoles()->create(['profile_completed' => true]);
    $administratorRole = Role::firstOrCreate(['name' => 'Administrator'], ['description' => 'Administrator']);
    $studentRole = Role::firstOrCreate(['name' => 'Student'], ['description' => 'Student']);
    $user->roles()->sync([$administratorRole->id, $studentRole->id]);

    $response = $this
        ->actingAs($user)
        ->post(route('profile.switch-role'), [
            'role' => 'Student',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/student/browse');

    expect(session('active_role'))->toBe('Student');
});

test('user can delete their account', function () {
    $user = User::factory()->withoutRoles()->create();

    $response = $this
        ->actingAs($user)
        ->withSession(['sso_authenticated_at' => now()->timestamp])
        ->delete(route('profile.destroy'), [
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    // User should be soft-deleted, not hard deleted
    expect($user->fresh()->deleted_at)->not->toBeNull();
});

test('stale sessions are redirected to google sign in before deleting account', function () {
    $user = User::factory()->withoutRoles()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
        ]);

    $response->assertRedirect(route('auth.google'));

    $this->assertGuest();
    expect($user->fresh()->deleted_at)->toBeNull();
    expect(session('pending_account_deletion'))->toBeTrue();
});