<?php

use App\Models\Researcher;

it('clears user_id when revoking researcher access', function () {
    $r = new Researcher([
        'user_id' => 123,
    ]);

    $r->revokeAccess();

    expect($r->user_id)->toBeNull();
});
