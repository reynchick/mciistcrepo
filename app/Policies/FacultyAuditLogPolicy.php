<?php

namespace App\Policies;

use App\Models\User;
use App\Models\FacultyAuditLog;

class FacultyAuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function view(User $user, FacultyAuditLog $log): bool
    {
        return $user->isAdministrator();
    }
}
