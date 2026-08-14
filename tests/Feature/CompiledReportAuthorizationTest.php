<?php

use App\Http\Requests\StoreCompiledReportRequest;
use App\Models\CompiledReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

uses(RefreshDatabase::class);

it('only allows administrators to create compiled reports', function () {
    $admin = User::factory()->asAdministrator()->create();
    $staff = User::factory()->asMCIISStaff()->create();

    $adminRequest = new StoreCompiledReportRequest();
    $adminRequest->setUserResolver(fn () => $admin);

    $staffRequest = new StoreCompiledReportRequest();
    $staffRequest->setUserResolver(fn () => $staff);

    expect($adminRequest->authorize())->toBeTrue();
    expect($staffRequest->authorize())->toBeFalse();
});

it('restricts compiled report policy access to administrators', function () {
    $admin = User::factory()->asAdministrator()->create();
    $staff = User::factory()->asMCIISStaff()->create();

    expect(Gate::forUser($admin)->allows('viewAny', CompiledReport::class))->toBeTrue();
    expect(Gate::forUser($staff)->allows('viewAny', CompiledReport::class))->toBeFalse();
});
