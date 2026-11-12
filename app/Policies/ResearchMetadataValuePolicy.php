<?php

namespace App\Policies;

use App\Models\ResearchMetadataValue;
use App\Models\User;

class ResearchMetadataValuePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isLibrarian() || $user->isAdministrator();
    }

    public function view(User $user, ResearchMetadataValue $metadataValue): bool
    {
        return $user->isLibrarian() || $user->isAdministrator();
    }

    public function create(User $user): bool
    {
        return $user->isLibrarian() || $user->isAdministrator();
    }

    public function update(User $user, ResearchMetadataValue $metadataValue): bool
    {
        return $user->isLibrarian() || $user->isAdministrator();
    }

    public function delete(User $user, ResearchMetadataValue $metadataValue): bool
    {
        return $user->isLibrarian() || $user->isAdministrator();
    }

    public function export(User $user): bool
    {
        return $user->isLibrarian() || $user->isAdministrator();
    }
}
