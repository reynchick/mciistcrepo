<?php

namespace App\Policies;

use App\Models\Faculty;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class FacultyPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view faculty list
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Faculty $faculty): bool
    {
        // All authenticated users can view individual faculty
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Only Administrator can create faculty
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Faculty $faculty): bool
    {
        // Only Administrator can update faculty records
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Faculty $faculty): bool
    {
        // Only Administrator can delete faculty
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Faculty $faculty): bool
    {
        // Only Administrator can restore faculty
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Faculty $faculty): bool
    {
        // Only Administrator can permanently delete faculty
        return $user->isAdministrator();
    }
}
