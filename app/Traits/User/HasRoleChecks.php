<?php

namespace App\Traits\User;

trait HasRoleChecks
{
    public function hasRole(string $role): bool
    {
        $requestedRole = $this->normalizeRoleName($role);
        if ($requestedRole === null) {
            return false;
        }

        $activeRole = $this->normalizeRoleName($this->getActiveRoleName());
        if ($activeRole !== null && $activeRole === $requestedRole) {
            return true;
        }

        return $this->roles()->where('name', $requestedRole)->exists();
    }

    public function hasAnyRole(array $roles): bool
    {
        $normalizedRoles = array_values(array_filter(array_map(fn ($role) => $this->normalizeRoleName($role), $roles)));
        if ($normalizedRoles === []) {
            return false;
        }

        $activeRole = $this->normalizeRoleName($this->getActiveRoleName());
        if ($activeRole !== null && in_array($activeRole, $normalizedRoles, true)) {
            return true;
        }

        return $this->roles()->whereIn('name', $normalizedRoles)->exists();
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

    protected function getActiveRoleName(): ?string
    {
        $activeRole = session('active_role');

        if (is_string($activeRole) && trim($activeRole) !== '') {
            return trim($activeRole);
        }

        return null;
    }

    protected function normalizeRoleName(?string $role): ?string
    {
        $name = trim((string) $role);
        if ($name === '') {
            return null;
        }

        return match (mb_strtolower($name)) {
            'administrator', 'admin' => 'Administrator',
            'mciis staff', 'mciis_staff', 'staff' => 'MCIIS Staff',
            'faculty' => 'Faculty',
            'student' => 'Student',
            default => $name,
        };
    }
}
