<?php

namespace App\Listeners;

use App\Events\UserRoleAttached;
use App\Models\Role;
use App\Services\AuditLogService;

class LogUserRoleAttached
{
    public function handle(UserRoleAttached $event): void
    {
        $user = $event->user;
        $user->load('roles');
        
        $newRoles = $user->roles->pluck('name', 'id')->toArray();
        $addedRoles = Role::whereIn('id', $event->roleIds)->pluck('name', 'id')->toArray();
        
        // Old roles = new roles minus added
        $oldRoles = array_diff_key($newRoles, array_flip($event->roleIds));
        
        app(AuditLogService::class)->logUserRoleChange(
            $user,
            $oldRoles,
            $newRoles,
            $addedRoles,
            []
        );
    }
}
