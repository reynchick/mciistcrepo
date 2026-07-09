<?php

namespace App\Listeners;

use App\Events\ResearchAccessed;
use App\Models\ResearchAccessLog;

class LogResearchAccess
{
    public function handle(ResearchAccessed $event): void
    {
        ResearchAccessLog::create([
            'research_id' => $event->researchId,
            'user_id' => $event->userId,
            'ip_address' => $event->ipAddress,
            'user_agent' => $event->userAgent,
        ]);
    }
}
