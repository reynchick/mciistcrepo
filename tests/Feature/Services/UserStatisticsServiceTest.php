<?php

use App\Models\Role;
use App\Models\User;
use App\Services\UserStatisticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function () {
    Carbon::setTestNow('2024-01-01 12:00:00');
    $this->service = new UserStatisticsService();
});

test('role distribution returns zeros when no users exist', function () {
    $distribution = $this->service->getRoleDistribution();

    $byRole = collect($distribution)->keyBy('role');

    expect($byRole['Administrator']['count'])->toBe(0)
        ->and($byRole['MCIIS Staff']['count'])->toBe(0)
        ->and($byRole['Faculty']['count'])->toBe(0)
        ->and($byRole['Student']['count'])->toBe(0);
});

test('role distribution counts users per role and ignores missing roles', function () {
    $admin = User::factory()->asAdministrator()->create();
    $faculty = User::factory()->asFaculty()->create();
    
    // Create a user with multiple roles manually
    $adminRole = Role::firstOrCreate(['name' => 'Administrator']);
    $facultyRole = Role::firstOrCreate(['name' => 'Faculty']);
    $extraRole = Role::create(['name' => 'Other']);
    $multi = User::factory()->withoutRoles()->create();
    $multi->roles()->attach([$adminRole->id, $facultyRole->id, $extraRole->id]);

    $distribution = $this->service->getRoleDistribution();
    $byRole = collect($distribution)->keyBy('role');

    expect($byRole['Administrator']['count'])->toBe(2);
    expect($byRole['Faculty']['count'])->toBe(2);
    expect($byRole['Student']['count'])->toBe(0);
    expect($byRole['MCIIS Staff']['count'])->toBe(0);
});

test('recent registrations count respects default and custom ranges', function () {
    User::factory()->withoutRoles()->create(['created_at' => Carbon::now()->subDays(5)]);
    User::factory()->withoutRoles()->create(['created_at' => Carbon::now()->subDays(40)]);

    expect($this->service->getRecentRegistrations()) // default 30 days
        ->toBe(1);

    expect($this->service->getRecentRegistrations(45))
        ->toBe(2);
});

test('user counts include total and soft-deleted users', function () {
    $active = User::factory()->withoutRoles()->create();
    $deleted = User::factory()->withoutRoles()->create();
    $deleted->delete();

    $counts = $this->service->getUserCounts();

    expect($counts['total'])->toBe(1)
        ->and($counts['deleted'])->toBe(1);
});

test('get all statistics aggregates role distribution, recent registrations, and counts', function () {
    $user = User::factory()->asStudent()->create(['created_at' => Carbon::now()->subDays(2)]);

    $stats = $this->service->getAllStatistics();

    $byRole = collect($stats['roleDistribution'])->keyBy('role');

    expect($stats['recentRegistrations'])->toBe(1);
    expect($stats['totalUsersCount'])->toBe(1);
    expect($stats['deletedUsersCount'])->toBe(0);
    expect($byRole['Student']['count'])->toBe(1);
});
