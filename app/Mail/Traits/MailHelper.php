<?php

namespace App\Mail\Traits;

trait MailHelper
{
    /**
     * Get role emoji mapping
     */
    protected function roleEmojis(): array
    {
        return [
            'Faculty' => '🎓',
            'Student' => '👨‍🎓',
            'Administrator' => '👤',
            'MCIIS Staff' => '👥',
        ];
    }

    /**
     * Get the primary role name based on priority
     */
    protected function primaryRoleName(): ?string
    {
        $priority = ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'];

        foreach ($priority as $roleName) {
            if ($this->user->roles->contains('name', $roleName)) {
                return $roleName;
            }
        }

        return $this->user->roles->first()?->name;
    }

    /**
     * Format roles with emojis and pipe separators
     */
    protected function formatRolesWithEmojis(): string
    {
        $roleEmojis = $this->roleEmojis();
        
        $formatted = $this->user->roles->map(function ($role) use ($roleEmojis) {
            $emoji = $roleEmojis[$role->name] ?? '•';
            return "{$emoji} {$role->name}";
        })->toArray();

        return implode(' | ', $formatted);
    }
}
