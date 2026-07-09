<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Srig;

class SrigPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Srig $srig): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function update(User $user, Srig $srig): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function delete(User $user, Srig $srig): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }
}
