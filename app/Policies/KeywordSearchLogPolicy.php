<?php

namespace App\Policies;

use App\Models\User;
use App\Models\KeywordSearchLog;

class KeywordSearchLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function view(User $user, KeywordSearchLog $log): bool
    {
        return $user->isAdministrator();
    }
}
