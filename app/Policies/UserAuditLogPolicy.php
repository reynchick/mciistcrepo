<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserAuditLog;

class UserAuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function view(User $user, UserAuditLog $log): bool
    {
        return $user->isAdministrator();
    }
}
