<?php

use App\Models\Research;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function attachRole(User $user, string $roleName): void
{
    $role = Role::firstOrCreate(['name' => $roleName]);
    $user->roles()->syncWithoutDetaching([$role->id]);
}

describe('research policy workflow', function () {
    it('allows administrators to manage status transitions and hard deletes', function () {
        $admin = User::factory()->create();
        attachRole($admin, 'Administrator');

        $research = Research::factory()->create();

        expect($admin->can('archive', $research))->toBeTrue()
            ->and($admin->can('restore', $research))->toBeTrue()
            ->and($admin->can('hardDelete', $research))->toBeTrue()
            ->and($admin->can('changeStatus', $research))->toBeTrue();
    });

    it('restricts research entry logs to administrators only', function () {
        $admin = User::factory()->create();
        attachRole($admin, 'Administrator');

        $staff = User::factory()->create();
        attachRole($staff, 'MCIIS Staff');

        $research = Research::factory()->create();
        $log = $research->researchEntryLogsTargeting()->create([
            'action_type' => 'create_research_entry',
            'modified_by' => $staff->id,
            'old_values' => [],
            'new_values' => [],
            'metadata' => [],
        ]);

        expect($admin->can('view', $log))->toBeTrue()
            ->and($staff->can('view', $log))->toBeFalse();
    });
});
