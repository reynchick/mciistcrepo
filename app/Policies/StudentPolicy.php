<?php

namespace App\Policies;

use App\Models\User;

class StudentPolicy
{
    /**
     * Determine whether the user can view any students.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can view a specific student.
     */
    public function view(User $user, User $student): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can create a student.
     */
    public function create(User $user): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can update a student.
     */
    public function update(User $user, User $student): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can delete a student.
     */
    public function delete(User $user, User $student): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can restore a deleted student.
     */
    public function restore(User $user, User $student): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can force delete a student.
     */
    public function forceDelete(User $user, User $student): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can approve student access.
     */
    public function approveAccess(User $user, User $student): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can revoke student access.
     */
    public function revokeAccess(User $user, User $student): bool
    {
        return $user->isAdministrator();
    }

    /**
     * Determine whether the user can import students via CSV.
     */
    public function importCsv(User $user): bool
    {
        return $user->isAdministrator();
    }
}
