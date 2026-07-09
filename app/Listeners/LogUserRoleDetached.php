<?php

namespace App\Listeners;

use App\Events\UserRoleDetached;
use App\Models\Role;
use App\Services\AuditLogService;

class LogUserRoleDetached
{
    public function handle(UserRoleDetached $event): void
    {
        $user = $event->user;
        $user->load('roles');
        
        $newRoles = $user->roles->pluck('name', 'id')->toArray();
        $removedRoles = Role::whereIn('id', $event->roleIds)->pluck('name', 'id')->toArray();
        
        // Old roles = new roles plus removed
        $oldRoles = $newRoles + $removedRoles;
        
        app(AuditLogService::class)->logUserRoleChange(
            $user,
            $oldRoles,
            $newRoles,
            [],
            $removedRoles
        );
    }
}
