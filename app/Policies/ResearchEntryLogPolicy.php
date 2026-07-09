<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ResearchEntryLog;

class ResearchEntryLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function view(User $user, ResearchEntryLog $log): bool
    {
        if ($user->isAdministrator() || $user->isMCIISStaff()) {
            return true;
        }

        if ($user->isFaculty() && $user->faculty) {
            $research = $log->research ?? null;
            return $research && $research->research_adviser === $user->faculty->id;
        }

        return false;
    }
}
