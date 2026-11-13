<?php

namespace App\Listeners;

use App\Events\KeywordSearched;
use App\Services\ResearchSearchService;

class LogKeywordSearch
{
    public function handle(KeywordSearched $event): void
    {
        if ($event->searchTerm !== null) {
            app(ResearchSearchService::class)->logKeywordSearch($event->searchTerm);
        }
    }
}
