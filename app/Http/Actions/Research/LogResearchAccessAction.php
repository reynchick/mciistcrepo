<?php

namespace App\Http\Actions\Research;

use App\Models\ResearchAccessLog;
use Illuminate\Support\Carbon;

class LogResearchAccessAction
{
    /**
     * Log research access with a 5-minute dedupe window per user.
     */
    public function execute(int $researchId, ?int $userId, string $ipAddress, string $userAgent): void
    {
        $recentExists = ResearchAccessLog::where('research_id', $researchId)
            ->where('user_id', $userId)
            ->where('created_at', '>=', Carbon::now()->subMinutes(5))
            ->exists();

        if ($recentExists) {
            return;
        }

        ResearchAccessLog::create([
            'research_id' => $researchId,
            'user_id' => $userId,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }
}
