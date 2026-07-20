<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ResearchEntryLog;

class ResearchEntryLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function view(User $user, ResearchEntryLog $log): bool
    {
        return $user->isAdministrator();
    }
}
