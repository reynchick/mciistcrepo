<?php

namespace App\Events;

use App\Models\User;

class UserRoleDetached
{
    public User $user;
    public array $roleIds;

    public function __construct(User $user, array $roleIds)
    {
        $this->user = $user;
        $this->roleIds = $roleIds;
    }
}
