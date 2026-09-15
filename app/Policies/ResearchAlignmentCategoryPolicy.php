<?php

namespace App\Policies;

use App\Models\ResearchAlignmentCategory;
use App\Models\User;

class ResearchAlignmentCategoryPolicy
{
    public function viewAny(?User $user): bool
    {
        return $user?->isAdministrator() ?? false;
    }

    public function view(?User $user, ResearchAlignmentCategory $category): bool
    {
        return $user?->isAdministrator() ?? false;
    }

    public function create(User $user): bool
    {
        return $user->isAdministrator();
    }

    public function update(User $user, ResearchAlignmentCategory $category): bool
    {
        return $user->isAdministrator();
    }

    public function delete(User $user, ResearchAlignmentCategory $category): bool
    {
        return $user->isAdministrator();
    }
}