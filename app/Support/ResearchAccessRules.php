<?php

namespace App\Support;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\User;

class ResearchAccessRules
{
    public static function isStaffOrAdmin(User $user): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public static function isFacultyAdviser(User $user, Research $research): bool
    {
        if (! $user->isFaculty() || ! $user->faculty) {
            return false;
        }

        return $research->research_adviser === $user->faculty->id;
    }

    public static function canManageFacultyDraft(User $user, Research $research): bool
    {
        if (! self::isFacultyAdviser($user, $research)) {
            return false;
        }

        $status = $research->status?->value ?? $research->status;

        return ($research->uploadedBy?->isFaculty() ?? false)
            && in_array($status, [ResearchStatus::DRAFT->value, ResearchStatus::RETURNED->value], true);
    }

    public static function canManageFiles(User $user, Research $research): bool
    {
        if (self::isStaffOrAdmin($user)) {
            return true;
        }

        if (! self::isFacultyAdviser($user, $research)) {
            return false;
        }

        $status = $research->status?->value ?? $research->status;

        return in_array($status, [ResearchStatus::RETURNED->value, ResearchStatus::DRAFT->value], true);
    }
}
