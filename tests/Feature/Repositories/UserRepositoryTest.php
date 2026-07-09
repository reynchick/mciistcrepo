<?php

use App\Models\Role;
use App\Models\User;
use App\Models\UserAuditLog;
use App\Repositories\UserRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->repository = new UserRepository();
});

test('findWithFilters filters by role, search, and default sorting', function () {
    $admin = User::factory()->asAdministrator()->create(['first_name' => 'Alice', 'email' => 'alice@example.com']);
    $faculty = User::factory()->asFaculty()->create(['first_name' => 'Bob', 'email' => 'bob@example.com']);

    // Role filter
    $filteredByRole = $this->repository->findWithFilters(['role' => 'Administrator', 'per_page' => 50]);
    expect($filteredByRole->count())->toBe(1)
        ->and($filteredByRole->first()->id)->toBe($admin->id);

    // Search filter (by email substring, case-insensitive)
    $filteredBySearch = $this->repository->findWithFilters(['search' => 'bob@', 'per_page' => 50]);
    expect($filteredBySearch->count())->toBe(1)
        ->and($filteredBySearch->first()->id)->toBe($faculty->id);
});

test('findWithFilters can include only soft-deleted users', function () {
    $active = User::factory()->withoutRoles()->create();
    $deleted = User::factory()->withoutRoles()->create();
    $deleted->delete();

    $result = $this->repository->findWithFilters(['status' => 'deleted', 'per_page' => 50]);

    expect($result->count())->toBe(1)
        ->and($result->first()->id)->toBe($deleted->id);
});

test('getAuditLogs returns formatted logs in chronological order', function () {
    $user = User::factory()->withoutRoles()->create();
    $actor = User::factory()->withoutRoles()->create(['first_name' => 'Jane', 'last_name' => 'Doe']);

    $older = UserAuditLog::factory()->create([
        'target_user_id' => $user->id,
        'modified_by' => $actor->id,
        'action_type' => 'update',
        'created_at' => now()->subDay(),
    ]);

    $newer = UserAuditLog::factory()->create([
        'target_user_id' => $user->id,
        'modified_by' => $actor->id,
        'action_type' => 'delete',
        'created_at' => now(),
    ]);

    $logs = $this->repository->getAuditLogs($user, 5);

    expect($logs)->toHaveCount(2);
    expect($logs[0]['id'])->toBe($older->id);
    expect($logs[1]['id'])->toBe($newer->id);
    expect($logs[0]['modified_by']['first_name'])->toBe('Jane');
});

test('getAdministratorCount excludes soft-deleted accounts', function () {
    // Create active admin with exactly one role
    $activeAdmin = User::factory()->asAdministrator()->create();
    expect($activeAdmin->roles)->toHaveCount(1)
        ->and($activeAdmin->roles->first()->name)->toBe('Administrator');

    // Create soft-deleted admin
    $deletedAdmin = User::factory()->asAdministrator()->create();
    expect($deletedAdmin->roles)->toHaveCount(1)
        ->and($deletedAdmin->roles->first()->name)->toBe('Administrator');

    $deletedAdmin->delete();

    // Count should only include active admins
    expect($this->repository->getAdministratorCount())->toBe(1);
});
