<?php

namespace App\Services;

use App\Models\Research;
use App\Models\Keyword;
use App\Models\Faculty;
use App\Models\Researcher;
use App\Models\KeywordSearchLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

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
        $researches = Research::whereRaw('LOWER(research_title) LIKE ?', ["%{$searchTerm}%"])
            ->whereNull('archived_at')
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

    /**
     * Log a keyword search - links to keyword_id if matched
     */
    public function logKeywordSearch(string $searchTerm, ?int $keywordId = null, ?int $userId = null, ?string $ipAddress = null, ?string $userAgent = null): void
    {
        // If no keyword_id provided, try to find exact match
        if (!$keywordId) {
            $keyword = Keyword::whereRaw('LOWER(keyword_name) = ?', [strtolower(trim($searchTerm))])
                ->first();
            if ($keyword) {
                $keywordId = $keyword->id;
            }
        }

        // Always log the search, with keyword_id if matched, null otherwise
        KeywordSearchLog::create([
            'keyword_id' => $keywordId,
            'search_term' => $searchTerm,
            'user_id' => $userId ?? Auth::id(),
            'ip_address' => $ipAddress ?? request()->ip(),
            'user_agent' => $userAgent ?? request()->userAgent(),
        ]);
    }

    /**
     * Find and log keyword if search term exists
     */
    public function findAndLogKeywordFromSearch(string $searchTerm, ?int $userId = null, ?string $ipAddress = null, ?string $userAgent = null): void
    {
        $keyword = Keyword::where('keyword_name', 'like', "%{$searchTerm}%")->first();
       
        if ($keyword) {
            KeywordSearchLog::create([
                'keyword_id' => $keyword->id,
                'user_id' => $userId ?? Auth::id(),
                'ip_address' => $ipAddress ?? request()->ip(),
                'user_agent' => $userAgent ?? request()->userAgent(),
            ]);
        }
    }
}
