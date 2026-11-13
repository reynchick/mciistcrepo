<?php

namespace App\Listeners;

use App\Events\ResearchAccessed;
use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Services\ResearchService;
use Illuminate\Support\Facades\Log;
use Throwable;

class LogResearchAccess
{
    public function handle(ResearchAccessed $event): void
    {
        if ($event->userId === null) {
            return;
        }

        try {
            $research = Research::query()->find($event->researchId);
            if ($research && $research->status?->value === ResearchStatus::POSTED->value && $research->archived_at === null) {
                app(ResearchService::class)->logAccess($research, $event->userId);
            }
        } catch (Throwable $exception) {
            Log::error('Unable to process authenticated research access event.', ['exception' => $exception]);
        }
    }
}
