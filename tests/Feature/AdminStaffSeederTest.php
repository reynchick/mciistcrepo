<?php

use App\Models\User;
use Database\Seeders\AdminStaffSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

function configureBootstrapAdmin(?string $email, ?string $lookupEmail = null): void
{
    config([
        'bootstrap-users.administrator' => [
            'email' => $email,
            'lookup_email' => $lookupEmail,
            'first_name' => 'Bootstrap',
            'middle_name' => 'A.',
            'last_name' => 'Administrator',
            'contact_number' => '09123456789',
        ],
        'bootstrap-users.staff' => [
            'email' => null,
            'lookup_email' => null,
            'first_name' => null,
            'middle_name' => null,
            'last_name' => null,
            'contact_number' => null,
        ],
    ]);
}

test('seeder creates configured accounts as passwordless google sso users', function () {
    configureBootstrapAdmin('admin@usep.edu.ph');

    app(AdminStaffSeeder::class)->run();

    $user = User::where('email', 'admin@usep.edu.ph')->firstOrFail();

    expect($user->first_name)->toBe('Bootstrap')
        ->and($user->last_name)->toBe('Administrator')
        ->and($user->password)->toBeNull()
        ->and($user->google_id)->toBeNull()
        ->and($user->created_by_admin)->toBeTrue()
        ->and($user->roles()->pluck('name')->all())->toContain('Administrator');
});

test('seeder changes an existing account email using its configured lookup email', function () {
    configureBootstrapAdmin('old-admin@usep.edu.ph');
    app(AdminStaffSeeder::class)->run();

    $user = User::where('email', 'old-admin@usep.edu.ph')->firstOrFail();
    $user->forceFill([
        'google_id' => 'old-google-id',
        'avatar' => 'https://example.test/avatar.png',
        'email_verified_at' => now(),
        'first_login_completed' => true,
        'password' => Hash::make('should-be-cleared'),
    ])->save();

    configureBootstrapAdmin('new-admin@usep.edu.ph', 'old-admin@usep.edu.ph');
    app(AdminStaffSeeder::class)->run();

    $user->refresh();
    expect(User::count())->toBe(1)
        ->and($user->email)->toBe('new-admin@usep.edu.ph')
        ->and($user->google_id)->toBeNull()
        ->and($user->avatar)->toBeNull()
        ->and($user->email_verified_at)->toBeNull()
        ->and($user->first_login_completed)->toBeFalse()
        ->and($user->password)->toBeNull()
        ->and($user->roles()->pluck('name')->all())->toContain('Administrator');
});

test('seeder reruns preserve google sso state when the email has not changed', function () {
    configureBootstrapAdmin('admin@usep.edu.ph');
    app(AdminStaffSeeder::class)->run();

    $user = User::where('email', 'admin@usep.edu.ph')->firstOrFail();
    $verifiedAt = now()->startOfSecond();
    $user->forceFill([
        'google_id' => 'linked-google-id',
        'avatar' => 'https://example.test/avatar.png',
        'email_verified_at' => $verifiedAt,
        'first_login_completed' => true,
    ])->save();

    app(AdminStaffSeeder::class)->run();

    expect(User::count())->toBe(1)
        ->and($user->fresh()->google_id)->toBe('linked-google-id')
        ->and($user->fresh()->avatar)->toBe('https://example.test/avatar.png')
        ->and($user->fresh()->email_verified_at)->toBe($verifiedAt->format('Y-m-d H:i:s'))
        ->and($user->fresh()->first_login_completed)->toBeTrue();
});

test('seeder rejects a target email already owned by another user', function () {
    configureBootstrapAdmin('claimed-admin@usep.edu.ph', 'old-admin@usep.edu.ph');
    User::factory()->create(['email' => 'claimed-admin@usep.edu.ph']);

    expect(fn () => app(AdminStaffSeeder::class)->run())
        ->toThrow(InvalidArgumentException::class, 'Bootstrap Administrator target email is already assigned to another user.');
});
