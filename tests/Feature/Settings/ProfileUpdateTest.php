<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('profile page is displayed', function () {
    $user = User::factory()->withoutRoles()->create(['profile_completed' => true]);

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->withoutRoles()->create(['profile_completed' => true]);

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
    $user = User::factory()->withoutRoles()->create(['profile_completed' => true]);

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

test('user can delete their account', function () {
    $user = User::factory()->withoutRoles()->create(['profile_completed' => true]);

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
    $user = User::factory()->withoutRoles()->create(['profile_completed' => true]);

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