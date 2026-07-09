<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ResearchAccessLog;

class ResearchAccessLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function view(User $user, ResearchAccessLog $log): bool
    {
        return $user->isAdministrator();
    }
}
