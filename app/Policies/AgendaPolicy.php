<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Agenda;

class AgendaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Agenda $agenda): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function update(User $user, Agenda $agenda): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function delete(User $user, Agenda $agenda): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }
}
