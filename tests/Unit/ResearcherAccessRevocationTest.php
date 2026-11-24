<?php

use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('clears user_id when revoking researcher access', function () {
    $user = User::factory()->create();
    $research = Research::factory()->create();
    $researcher = $research->researchers()->create([
        'first_name' => 'Test',
        'last_name' => 'Researcher',
        'email' => 'researcher@usep.edu.ph',
        'user_id' => $user->id,
    ]);

    $researcher->revokeAccess();

    expect($researcher->refresh()->user_id)->toBeNull();
});
