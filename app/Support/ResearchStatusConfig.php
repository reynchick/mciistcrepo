<?php

namespace App\Support;

class ResearchStatusConfig
{
    public static function defaults(): array
    {
        return config('research.defaults', []);
    }

    public static function statuses(): array
    {
        return config('research.statuses', []);
    }

    public static function transitions(): array
    {
        return config('research.transitions', []);
    }

    public static function entryModes(): array
    {
        return config('research.entry_modes', []);
    }

    public static function statusFilterOptions(): array
    {
        return config('research.status_filter_options', []);
    }

    public static function statusLabel(?string $status, ?string $context = null): string
    {
        if (empty($status)) {
            return 'Unknown';
        }

        $config = self::statuses()[$status] ?? [];
        $label = $config['label'] ?? ucfirst($status);

        if ($context === 'staff_metadata_request' && $status === 'published') {
            return 'Staff metadata request';
        }

        return $label;
    }

    public static function badgeColor(?string $status): string
    {
        if (empty($status)) {
            return 'gray';
        }

        return self::statuses()[$status]['badge'] ?? 'gray';
    }

    public static function entryModeLabel(?string $mode): string
    {
        if (empty($mode)) {
            return 'Unknown';
        }

        return self::entryModes()[$mode]['label'] ?? ucfirst(str_replace('_', ' ', $mode));
    }

    public static function canTransition(?string $fromStatus, string $toStatus, string $role): bool
    {
        if (empty($fromStatus)) {
            return false;
        }

        $transitions = self::transitions()[$fromStatus]['to'] ?? [];

        if (!in_array($toStatus, $transitions, true)) {
            return false;
        }

        $roleRules = self::transitions()[$fromStatus][$toStatus]['roles'] ?? [];

        return in_array($role, $roleRules, true);
    }

    public static function filterLabel(string $filter): string
    {
        foreach (self::statusFilterOptions() as $option) {
            if (($option['value'] ?? null) === $filter) {
                return $option['label'] ?? ucfirst($filter);
            }
        }

        return ucfirst($filter);
    }
}