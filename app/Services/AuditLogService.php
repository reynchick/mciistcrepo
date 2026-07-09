<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserAuditLog;

class AuditLogService
{
	/**
	 * Log role changes for a user (many-to-many pivot updates).
	 *
	 * @param User $user
	 * @param array $originalRoles [role_id => role_name]
	 * @param array $newRoles [role_id => role_name]
	 * @param array $addedRoles [role_id => role_name]
	 * @param array $removedRoles [role_id => role_name]
	 */
	public function logUserRoleChange(
		User $user,
		array $originalRoles,
		array $newRoles,
		array $addedRoles,
		array $removedRoles
	): void {
		$actor = auth()->user();
		UserAuditLog::create([
			'target_user_id' => $user->id,
			'modified_by' => auth()->id(),
			'action_type' => UserAuditLog::ACTION_UPDATE,
			'old_values' => [
				'roles' => $originalRoles,
			],
			'new_values' => [
				'roles' => $newRoles,
			],
			'metadata' => [
				'changed' => ['roles'],
				'roles_added' => $addedRoles,
				'roles_removed' => $removedRoles,
				'actor_snapshot' => $actor?->auditSnapshot(),
				'target_snapshot' => $user->auditSnapshot(),
			],
			'ip_address' => request()->ip(),
			'user_agent' => request()->userAgent(),
		]);
	}
}
