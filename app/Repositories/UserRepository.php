<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\UserAuditLog;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class UserRepository
{
    /**
     * Find users with filters and pagination.
     *
     * @param array $filters Array of filter parameters
     *   - search: string - Search term for ID, name, email, student_id, faculty_id, contact
     *   - role: string - Filter by role name
     *   - status: string - Filter by status (deleted/active)
     *   - sort_by: string - Column to sort by
     *   - sort_order: string - Sort order (asc/desc)
     *   - per_page: int - Number of items per page (default: 15)
     * @return LengthAwarePaginator
     */
    public function findWithFilters(array $filters): LengthAwarePaginator
    {
        $showDeleted = ($filters['status'] ?? null) === 'deleted';
        $search = $filters['search'] ?? null;
        $role = $filters['role'] ?? null;
        $sortBy = $filters['sort_by'] ?? null;
        $sortOrder = $filters['sort_order'] ?? 'asc';
        $perPage = $filters['per_page'] ?? 15;

        $query = User::with('roles');

        // Handle soft-deleted users filter
        if ($showDeleted) {
            $query->onlyTrashed();
        }

        // Handle search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                // If search is numeric, try to match by ID first
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $searchTerm = strtolower($search);
                    $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$searchTerm}%"])
                      ->orWhereRaw('LOWER(middle_name) LIKE ?', ["%{$searchTerm}%"])
                      ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$searchTerm}%"])
                      ->orWhereRaw('LOWER(email) LIKE ?', ["%{$searchTerm}%"])
                      ->orWhere('student_id', 'like', "%{$search}%")
                      ->orWhere('faculty_id', 'like', "%{$search}%")
                      ->orWhere('contact_number', 'like', "%{$search}%");
                }
            });
        }

        // Handle role filter
        if ($role) {
            $query->whereHas('roles', function($q) use ($role) {
                $q->where('name', $role);
            });
        }

        // Handle sorting
        if ($sortBy) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            // Default sorting
            $query->orderBy('created_at', 'desc');
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get formatted audit logs for a user.
     *
     * @param User $user The user to get audit logs for
     * @param int $limit Maximum number of logs to retrieve
     * @return Collection Formatted collection of audit logs
     */
    public function getAuditLogs(User $user, int $limit = 20): Collection
    {
        return UserAuditLog::where('target_user_id', $user->id)
            ->with(['modifiedBy:id,first_name,last_name'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($log) => [
                'id' => $log->id,
                'action_type' => $log->action_type,
                'created_at' => $log->created_at,
                'modified_by' => $log->modifiedBy ? [
                    'id' => $log->modifiedBy->id,
                    'first_name' => $log->modifiedBy->first_name,
                    'last_name' => $log->modifiedBy->last_name,
                ] : null,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'metadata' => $log->metadata,
            ])
            ->reverse()
            ->values();
    }

    /**
     * Get count of administrators (excludes soft-deleted accounts).
     *
     * @return int Number of active administrators
     */
    public function getAdministratorCount(): int
    {
        return User::whereHas('roles', fn($q) => $q->where('name', 'Administrator'))->count();
    }

    /**
     * Find user by ID with roles relationship.
     *
     * @param int $id User ID
     * @return User|null
     */
    public function findWithRoles(int $id): ?User
    {
        return User::with('roles')->find($id);
    }

    /**
     * Get all available roles.
     *
     * @return Collection
     */
    public function getAllRoles(): Collection
    {
        return \App\Models\Role::all();
    }
}
