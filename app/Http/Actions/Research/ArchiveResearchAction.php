<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\User;

class ArchiveResearchAction
{
    /**
     * Archive a research entry with metadata for observer/audit usage.
     */
    public function execute(Research $research, string $reason, User $user): bool
    {
        return $research->archive($user, $reason);
    }
}
