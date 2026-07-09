<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Sdg;

class SdgPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Sdg $sdg): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function update(User $user, Sdg $sdg): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function delete(User $user, Sdg $sdg): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }
}
