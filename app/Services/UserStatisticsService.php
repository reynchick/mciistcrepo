<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class UserStatisticsService
{
    /**
     * Get role distribution data for all users.
     *
     * @return array Formatted role distribution with role names and counts
     */
    public function getRoleDistribution(): array
    {
        // Initialize default roles
        $roleDistribution = collect([
            'Administrator' => 0,
            'MCIIS Staff' => 0,
            'Faculty' => 0,
            'Student' => 0,
        ]);

        // Get actual counts from database
        $userRoleCounts = User::with('roles')
            ->get()
            ->flatMap(fn($user) => $user->roles)
            ->groupBy('name')
            ->map(fn($group) => $group->count());

        // Merge actual counts with defaults
        foreach ($userRoleCounts as $roleName => $count) {
            $roleDistribution[$roleName] = $count;
        }

        // Format for frontend consumption
        return $roleDistribution
            ->map(fn($count, $name) => [
                'role' => $name,
                'count' => $count,
            ])
            ->values()
            ->toArray();
    }

    /**
     * Get role distribution data for deleted users.
     *
     * @return array Formatted role distribution with role names and counts
     */
    public function getDeletedRoleDistribution(): array
    {
        // Initialize default roles
        $roleDistribution = collect([
            'Administrator' => 0,
            'MCIIS Staff' => 0,
            'Faculty' => 0,
            'Student' => 0,
        ]);

        // Get actual counts from database for deleted users
        $userRoleCounts = User::onlyTrashed()
            ->with('roles')
            ->get()
            ->flatMap(fn($user) => $user->roles)
            ->groupBy('name')
            ->map(fn($group) => $group->count());

        // Merge actual counts with defaults
        foreach ($userRoleCounts as $roleName => $count) {
            $roleDistribution[$roleName] = $count;
        }

        // Format for frontend consumption
        return $roleDistribution
            ->map(fn($count, $name) => [
                'role' => $name,
                'count' => $count,
            ])
            ->values()
            ->toArray();
    }

    /**
     * Get count of recent user registrations.
     *
     * @param int $days Number of days to look back (default: 30)
     * @return int Number of users registered in the specified period
     */
    public function getRecentRegistrations(int $days = 30): int
    {
        return User::where('created_at', '>=', now()->subDays($days))->count();
    }

    /**
     * Get user counts (total and soft-deleted).
     *
     * @return array Contains 'total' and 'deleted' counts
     */
    public function getUserCounts(): array
    {
        return [
            'total' => User::count(),
            'deleted' => User::onlyTrashed()->count(),
        ];
    }

    /**
     * Get all statistics data at once.
     *
     * @return array Complete statistics data for dashboard
     */
    public function getAllStatistics(): array
    {
        $counts = $this->getUserCounts();
        
        return [
            'roleDistribution' => $this->getRoleDistribution(),
            'deletedRoleDistribution' => $this->getDeletedRoleDistribution(),
            'recentRegistrations' => $this->getRecentRegistrations(),
            'totalUsersCount' => $counts['total'],
            'deletedUsersCount' => $counts['deleted'],
        ];
    }
}
