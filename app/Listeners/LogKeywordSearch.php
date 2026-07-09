<?php

namespace App\Listeners;

use App\Events\KeywordSearched;
use App\Models\KeywordSearchLog;

class LogKeywordSearch
{
    public function handle(KeywordSearched $event): void
    {
        KeywordSearchLog::create([
            'keyword_id' => $event->keywordId,
            'user_id' => $event->userId,
            'ip_address' => $event->ipAddress,
            'user_agent' => $event->userAgent,
        ]);
    }
}
