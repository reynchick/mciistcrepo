<?php

namespace App\Traits\User;

trait HasRoleChecks
{
    public function hasRole(string $role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    public function hasAnyRole(array $roles): bool
    {
        return $this->roles()->whereIn('name', $roles)->exists();
    }

    public function isStudent(): bool
    {
        return $this->hasRole('Student');
    }

    public function isAdministrator(): bool
    {
        return $this->hasRole('Administrator');
    }

    public function isFaculty(): bool
    {
        return $this->hasRole('Faculty');
    }

    public function isMCIISStaff(): bool
    {
        return $this->hasRole('MCIIS Staff');
    }

    public function isAdminOrStaff(): bool
    {
        return $this->isAdministrator() || $this->isMCIISStaff();
    }
}
