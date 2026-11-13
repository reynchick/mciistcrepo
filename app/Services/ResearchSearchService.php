<?php

namespace App\Services;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\Keyword;
use App\Models\Faculty;
use App\Models\Researcher;
use App\Models\KeywordSearchLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

class ResearchSearchService
{
    /**
     * Get unified search suggestions (keywords, research titles, advisers, researchers)
     */
    public function getSearchSuggestions(string $query): Collection
    {
        if (strlen($query) < 2) {
            return collect([]);
        }

        $searchTerm = strtolower($query);
        $suggestions = collect();

        // Keywords - case insensitive
        $keywords = Keyword::whereRaw('LOWER(keyword_name) LIKE ?', ["%{$searchTerm}%"])
            ->limit(5)
            ->get(['id', 'keyword_name'])
            ->map(fn($k) => [
                'id' => $k->id,
                'name' => $k->keyword_name . ' (Keyword)',
                'type' => 'keyword',
            ]);
        $suggestions = $suggestions->concat($keywords);

        // Research titles - case insensitive
        $researches = Research::posted()
            ->whereRaw('LOWER(research_title) LIKE ?', ["%{$searchTerm}%"])
            ->limit(5)
            ->get(['id', 'research_title'])
            ->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->research_title . ' (Research Title)',
                'type' => 'research',
            ]);
        $suggestions = $suggestions->concat($researches);

        // Faculty advisers - case insensitive
        $advisers = Faculty::whereHas('advisedResearches')
            ->where(function($q) use ($searchTerm) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$searchTerm}%"])
                  ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$searchTerm}%"]);
            })
            ->limit(3)
            ->get(['id', 'first_name', 'last_name'])
            ->map(fn($f) => [
                'id' => $f->id,
                'name' => trim($f->first_name . ' ' . $f->last_name) . ' (Research Adviser)',
                'type' => 'adviser',
            ]);
        $suggestions = $suggestions->concat($advisers);

        // Researchers - case insensitive
        $researchers = Researcher::where(function($q) use ($searchTerm) {
                $q->whereRaw('LOWER(first_name) LIKE ?', ["%{$searchTerm}%"])
                  ->orWhereRaw('LOWER(last_name) LIKE ?', ["%{$searchTerm}%"]);
            })
            ->limit(3)
            ->get(['id', 'first_name', 'last_name'])
            ->map(fn($r) => [
                'id' => $r->id,
                'name' => trim($r->first_name . ' ' . $r->last_name) . ' (Researcher)',
                'type' => 'researcher',
            ]);
        $suggestions = $suggestions->concat($researchers);

        return $suggestions->take(10)->values();
    }

    /**
     * Get keyword suggestions as user types (autocomplete)
     */
    public function getKeywordSuggestions(string $query): Collection
    {
        if (strlen($query) < 2) {
            return collect([]);
        }

        $searchTerm = strtolower($query);

        return Keyword::whereRaw('LOWER(keyword_name) LIKE ?', ["%{$searchTerm}%"])
            ->orderBy('keyword_name', 'asc')
            ->limit(10)
            ->get(['id', 'keyword_name'])
            ->map(fn($k) => [
                'id' => $k->id,
                'name' => $k->keyword_name,
            ]);
    }

    /** Record only the normalized search term. Search history is anonymous. */
    public function logKeywordSearch(string $searchTerm): void
    {
        $normalized = mb_strtolower(trim($searchTerm));
        if (mb_strlen($normalized) < 2) {
            return;
        }

        try {
            KeywordSearchLog::create(['search_term' => $normalized]);
        } catch (Throwable $exception) {
            Log::error('Unable to record anonymous keyword search.', ['exception' => $exception]);
        }
    }

    /**
     * Find and log keyword if search term exists
     */
    public function findAndLogKeywordFromSearch(string $searchTerm, ?int $userId = null, ?string $ipAddress = null, ?string $userAgent = null): void
    {
        $this->logKeywordSearch($searchTerm);
    }
}
