<?php

namespace App\Http\Controllers;

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Services\ResearchSearchService;
use App\Services\ResearchService;
use App\Repositories\ResearchRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResearchSearchController extends Controller
{
    public function __construct(
        protected ResearchSearchService $searchService,
        protected ResearchService $researchService,
        protected ResearchRepository $researchRepository,
    ) {}

    public function browse(Request $request): Response
    {
        $filters = $this->researchRepository->normalizeFilters($request);
        $filters['status'] = ResearchStatus::PUBLISHED->value;

        $perPage = (int) $request->input('per_page', 12);
        $researches = $this->researchService->browse($filters, $perPage);

        return Inertia::render('browse/index', [
            'researches' => $researches,
            'filters' => array_merge($filters, [
                'page' => $researches->currentPage(),
                'per_page' => $researches->perPage(),
            ]),
            'filterOptions' => [
                'years' => $this->researchRepository->facetYears(),
                'programs' => Program::withActiveResearchCounts(),
                'advisers' => Faculty::advisersWithActiveCounts(),
            ],
        ]);
    }

    /**
     * Lightweight JSON details endpoint for inline card expansion.
     */
    public function details(Research $research): JsonResponse
    {
        $this->authorize('view', $research);
        $data = $this->researchService->details($research);
        return response()->json(['data' => $data]);
    }

    /**
     * Log an authenticated user's access to a research item.
     */
    public function logAccess(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Research::class);

        $validated = $request->validate([
            'research_id' => ['required', 'integer', 'exists:researches,id'],
            'action' => ['nullable', 'string', 'max:50'],
        ]);

        if (!$request->user()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $this->researchService->logAccess(
            Research::findOrFail($validated['research_id']),
            $request->user()->id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json(['message' => 'Logged'], 201);
    }

    /**
     * Get unified search suggestions (keywords, research titles, advisers, researchers).
     */
    public function searchSuggestions(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        $suggestions = $this->searchService->getSearchSuggestions($query);

        return response()->json(['suggestions' => $suggestions]);
    }

    /**
     * Get keyword suggestions as user types (autocomplete).
     */
    public function keywordSuggestions(Request $request): JsonResponse
    {
        $query = trim($request->input('q', ''));
        $suggestions = $this->searchService->getKeywordSuggestions($query);

        return response()->json(['suggestions' => $suggestions]);
    }

    /**
     * Log a keyword search (on submit) - logs all searches, links to keyword_id if matched.
     */
    public function logKeywordSearch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search_term' => ['required', 'string', 'max:255'],
            'keyword_id' => ['nullable', 'integer', 'exists:keywords,id'],
        ]);

        $this->searchService->logKeywordSearch(
            $validated['search_term'],
            $validated['keyword_id'] ?? null,
            $request->user()?->id,
            $request->ip(),
            $request->userAgent()
        );

        return response()->json(['message' => 'Search logged'], 201);
    }
}
