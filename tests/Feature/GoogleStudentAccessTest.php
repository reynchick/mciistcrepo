<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

uses(RefreshDatabase::class);

test('unapproved student Google SSO is rejected before the session is authenticated', function () {
    User::factory()->asStudent()->create([
        'email' => 'pending-student@usep.edu.ph',
        'google_id' => null,
        'student_access_approved' => false,
        'student_access_revoked_at' => null,
    ]);

    $googleUser = Mockery::mock(SocialiteUser::class);
    $googleUser->shouldReceive('getEmail')->andReturn('pending-student@usep.edu.ph');
    $googleUser->shouldReceive('getId')->andReturn('google-pending-student');
    $googleUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock();
    $provider->shouldReceive('user')->once()->andReturn($googleUser);

    Socialite::shouldReceive('driver')
        ->once()
        ->with('google')
        ->andReturn($provider);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'))
        ->assertSessionHas('error', 'Your student account is not yet approved. Please contact the administrator.');

    expect(Auth::check())->toBeFalse();
});
