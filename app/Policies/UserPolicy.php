<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function view(User $user, User $model): bool
    {
        return $user->isAdministrator();
    }

    public function create(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function update(User $user, User $model): bool
    {
        return $user->isAdministrator();
    }

    public function delete(User $user, User $model): bool
    {
        if (!$user->isAdministrator()) {
            return false;
        }

        // Block self-deletion
        if ($user->id === $model->id) {
            return false;
        }

        // Prevent deleting the last administrator
        $isTargetAdmin = $model->isAdministrator();
        if ($isTargetAdmin && User::administratorCount() <= 1) {
            return false;
        }

        return true;
    }

    public function restore(User $user, User $model): bool
    {
        // Only admins can restore deleted users
        return $user->isAdministrator();
    }
}