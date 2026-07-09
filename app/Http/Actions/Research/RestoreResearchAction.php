<?php

namespace App\Http\Actions\Research;

use App\Models\Research;
use App\Models\User;

class RestoreResearchAction
{
    /**
     * Restore a previously archived research entry.
     */
    public function execute(Research $research, User $user): bool
    {
        // Observer/audit layers can pick up the user context via model relations if needed.
        return $research->restore();
    }
}
