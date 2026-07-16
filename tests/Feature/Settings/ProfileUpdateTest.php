<?php

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