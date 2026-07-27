<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Models\ResearchAccessLog;
use App\Models\KeywordSearchLog;
use App\Models\Program;
use App\Repositories\ResearchRepository;
use App\Services\Statistics\CollegeStatisticsService;
use App\Services\Statistics\ProgramStatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected CollegeStatisticsService $collegeService,
        protected ProgramStatisticsService $programService,
        protected ResearchRepository $researchRepository,
    ) {}

    public function index(Request $request)
    {
        // Route by the role the user is acting as — not merely one they hold — so
        // a multi-role user (e.g. an admin who also has the MCIIS Staff role)
        // lands on the dashboard for their active role instead of always the
        // staff analytics view.
        if ($request->user()?->isActingAs('MCIIS Staff')) {
            return redirect()->route('staff.dashboard');
        }

        if ($request->user()?->isActingAs('Faculty') && $request->user()?->faculty) {
            $filters = $this->normalizeFacultyDashboardFilters($request);

            return Inertia::render('dashboard/faculty/index', [
                'facultyStats' => $this->facultyDashboardData($request, $request->user()->faculty),
                'filters' => [
                    'years' => $filters['years'],
                ],
                'filterOptions' => [
                    'years' => $this->facultyYearOptions($request->user()->faculty),
                ],
            ]);
        }

        $this->authorize('viewStatistics', Research::class);

        $yearOptions = $this->researchRepository->facetYears()->pluck('year')->values()->all();
        $defaultStart = $yearOptions ? min($yearOptions) : (int) date('Y');
        $defaultEnd = $yearOptions ? max($yearOptions) : (int) date('Y');

        $startYear = (int) $request->input('year_start', $defaultStart);
        $endYear = (int) $request->input('year_end', $defaultEnd);
        if ($startYear > $endYear) {
            [$startYear, $endYear] = [$endYear, $startYear];
        }

        // Get college-wide statistics
        $collegeView = $this->collegeService->getCollegeStatistics($startYear, $endYear);

        // Get program-specific view if requested
        $programId = (int) $request->input('program_id', 0);
        $programView = null;
        if ($programId) {
            $programView = $this->programService->getProgramDetailedView($programId, $startYear, $endYear);
        }

        // Top Accessed Research and Keywords - only for college view
        $topAccessedResearch = [];
        $topKeywords = [];
        
        if (!$programId) {
            $topAccessedResearch = ResearchAccessLog::select([
                    'research_access_logs.research_id',
                    DB::raw('researches.research_title as title'),
                    DB::raw('COUNT(*) as access_count'),
                    DB::raw('MAX(research_access_logs.created_at) as last_accessed'),
                ])
                ->join('researches', 'researches.id', '=', 'research_access_logs.research_id')
                ->groupBy('research_access_logs.research_id', 'researches.research_title')
                ->orderByDesc('access_count')
                ->limit(10)
                ->get()
                ->map(fn($log) => [
                    'id' => $log->research_id,
                    'title' => $log->title,
                    'count' => $log->access_count,
                    'lastAccessed' => $log->last_accessed,
                ]);

            $topKeywords = KeywordSearchLog::select([
                    DB::raw('COALESCE(keywords.keyword_name, keyword_search_logs.search_term) as name'),
                    DB::raw('COUNT(*) as search_count'),
                ])
                ->leftJoin('keywords', 'keywords.id', '=', 'keyword_search_logs.keyword_id')
                ->whereNotNull(DB::raw('COALESCE(keywords.keyword_name, keyword_search_logs.search_term)'))
                ->groupBy(DB::raw('COALESCE(keywords.keyword_name, keyword_search_logs.search_term)'))
                ->orderByDesc('search_count')
                ->limit(10)
                ->get()
                ->map(fn($log) => [
                    'keyword' => $log->name,
                    'count' => $log->search_count,
                    'trend' => 'flat',
                ]);
        }

        return Inertia::render('dashboard/admin/index', [
            'collegeView' => [
                'yearStart' => $collegeView['yearStart'],
                'yearEnd' => $collegeView['yearEnd'],
                'programs' => $collegeView['programs'],
                'totals' => $collegeView['totals'],
                'mostProductiveProgram' => $collegeView['mostProductiveProgram'],
            ],
            'yearOptions' => $yearOptions,
            'programView' => $programView,
            'topAccessedResearch' => $topAccessedResearch,
            'topKeywords' => $topKeywords,
            'alignmentSummary' => $collegeView['alignmentSummary'],
            'alignmentBreakdown' => $collegeView['alignmentBreakdown'],
        ]);
    }

    private function normalizeFacultyDashboardFilters(Request $request): array
    {
        $years = collect((array) $request->input('year', []))
            ->flatten()
            ->map(fn ($value) => (int) $value)
            ->filter()
            ->values()
            ->all();

        return [
            'years' => $years,
        ];
    }

    private function facultyYearOptions(\App\Models\Faculty $faculty): array
    {
        return Research::query()
            ->whereNull('archived_at')
            ->whereNotNull('published_year')
            ->selectRaw('published_year, COUNT(*) as count')
            ->groupBy('published_year')
            ->orderBy('published_year', 'desc')
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->published_year,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();
    }

    /**
     * Full-history yearly research count for a single program, independent
     * of the college-view's year_start/year_end filter. Powers the
     * "Research Trend" line chart on the admin dashboard.
     */
    private function facultyDashboardData(Request $request, \App\Models\Faculty $faculty): array
    {
        $years = collect((array) $request->input('year', []))
            ->flatten()
            ->map(fn ($value) => (int) $value)
            ->filter()
            ->values()
            ->all();

        $advisedQuery = Research::query()
            ->whereNull('archived_at')
            ->where('research_adviser', $faculty->id);

        $paneledQuery = Research::query()
            ->whereNull('archived_at')
            ->whereHas('panelists', fn ($query) => $query->where('faculties.id', $faculty->id));

        if (! empty($years)) {
            $advisedQuery->whereIn('published_year', $years);
            $paneledQuery->whereIn('published_year', $years);
        }

        $yearlyTrendAdvised = $advisedQuery
            ->selectRaw('published_year as year, COUNT(*) as count')
            ->groupBy('published_year')
            ->orderBy('published_year')
            ->get()
            ->map(fn ($row) => ['year' => (int) $row->year, 'count' => (int) $row->count])
            ->values()
            ->all();

        $yearlyTrendPaneled = $paneledQuery
            ->selectRaw('published_year as year, COUNT(*) as count')
            ->groupBy('published_year')
            ->orderBy('published_year')
            ->get()
            ->map(fn ($row) => ['year' => (int) $row->year, 'count' => (int) $row->count])
            ->values()
            ->all();

        return [
            'totals' => [
                'advised' => $advisedQuery->count(),
                'paneled' => $paneledQuery->count(),
            ],
            'yearlyTrendAdvised' => $yearlyTrendAdvised,
            'yearlyTrendPaneled' => $yearlyTrendPaneled,
            'lastUpdated' => Research::query()->whereNull('archived_at')->max('updated_at') ? (string) Research::query()->whereNull('archived_at')->max('updated_at') : null,
        ];
    }

    public function programTrend(Program $program): JsonResponse
    {
        $this->authorize('viewStatistics', Research::class);

        $data = Research::query()
            ->where('program_id', $program->id)
            ->whereNotNull('published_year')
            ->select([
                DB::raw('published_year as year'),
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy('published_year')
            ->orderBy('published_year')
            ->get();

        return response()->json(['data' => $data]);
    }
}