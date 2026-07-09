<?php

namespace App\Policies;

use App\Models\CompiledReport;
use App\Models\User;

class CompiledReportPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CompiledReport $compiledReport): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can download the model.
     */
    public function download(User $user, CompiledReport $compiledReport): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CompiledReport $compiledReport): bool
    {
        return $user->isAdministrator();
    }
}
