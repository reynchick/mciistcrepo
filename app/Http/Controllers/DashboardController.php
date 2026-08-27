<?php

namespace App\Http\Controllers;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\ResearchAccessLog;
use App\Models\KeywordSearchLog;
use App\Models\Program;
use App\Repositories\ResearchRepository;
use App\Services\Statistics\CollegeStatisticsService;
use App\Services\Statistics\AlignmentStatisticsService;
use App\Services\Statistics\ProgramStatisticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected CollegeStatisticsService $collegeService,
        protected ProgramStatisticsService $programService,
        protected AlignmentStatisticsService $alignmentService,
        protected ResearchRepository $researchRepository,
    ) {}

    public function index(Request $request): Response|RedirectResponse
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
                    'programs' => $filters['programs'],
                ],
                'filterOptions' => [
                    'years' => $this->facultyYearOptions($request->user()->faculty),
                    'programs' => $this->facultyProgramOptions($request->user()->faculty),
                ],
            ]);
        }

        if ($request->user()?->isActingAs('Student')) {
            return redirect()->route('student.my-researches');
        }

        $this->authorize('viewStatistics', Research::class);

        $yearOptions = $this->researchRepository->facetYears()->pluck('year')->values()->all();
        $defaultStart = $yearOptions ? min($yearOptions) : (int) date('Y');
        $defaultEnd = $yearOptions ? max($yearOptions) : (int) date('Y');

        $startYear = (int) $request->input('year_start', $defaultStart);
        $endYear = (int) $request->input('year_end', $defaultEnd);
        $statusFilter = $this->resolveStatusFilter($request);

        if ($startYear > $endYear) {
            [$startYear, $endYear] = [$endYear, $startYear];
        }

        // Get college-wide statistics
        $collegeView = $this->collegeService->getCollegeStatistics($startYear, $endYear);

        // Get program-specific view if requested
        $programId = (int) $request->input('program_id', 0);
        $programView = null;

        if ($programId) {
            $programView = $this->programService->getProgramDetailedView(
                $programId,
                $startYear,
                $endYear,
                $statusFilter
            );
        }

        // Top Accessed Research and Keywords - only for college view
        $topAccessedResearch = [];
        $topKeywords = [];

        if (! $programId) {
            $topAccessedResearch = ResearchAccessLog::select([
                    'research_access_logs.research_id',
                    DB::raw('researches.research_title as title'),
                    DB::raw('COUNT(*) as access_count'),
                    DB::raw('MAX(research_access_logs.created_at) as last_accessed'),
                ])
                ->join('researches', 'researches.id', '=', 'research_access_logs.research_id')
                ->where('researches.status', ResearchStatus::POSTED->value)
                ->groupBy('research_access_logs.research_id', 'researches.research_title')
                ->orderByDesc('access_count')
                ->limit(10)
                ->get()
                ->map(fn ($log) => [
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
                ->map(fn ($log) => [
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
            'statusFilter' => $statusFilter,
            'alignmentSummary' => $collegeView['alignmentSummary'],
            'alignmentBreakdown' => $collegeView['alignmentBreakdown'],
        ]);
    }

    private function resolveStatusFilter(Request $request): string
    {
        $status = (string) ($request->input('status_filter', $request->input('status', 'all')) ?? 'all');
        $status = trim($status);

        if ($status === '' || $status === 'all') {
            return 'all';
        }

        $validStatuses = array_map(
            fn (array $option) => (string) ($option['value'] ?? ''),
            config('research.status_filter_options', [])
        );

        if (in_array($status, $validStatuses, true)) {
            return $status;
        }

        return 'all';
    }

    private function normalizeFacultyDashboardFilters(Request $request): array
    {
        $years = collect((array) $request->input('year', []))
            ->flatten()
            ->map(fn ($value) => (int) $value)
            ->filter()
            ->values()
            ->all();

        $startYear = (int) $request->input('year_start', 0);
        $endYear = (int) $request->input('year_end', 0);

        if ($startYear && $endYear) {
            if ($startYear > $endYear) {
                [$startYear, $endYear] = [$endYear, $startYear];
            }

            $years = range($startYear, $endYear);
        }

        return [
            'years' => $years,
            'programs' => collect((array) $request->input('program', $request->input('programs', [])))
                ->flatten()
                ->map(fn ($value) => (int) $value)
                ->filter()
                ->values()
                ->all(),
        ];
    }

    private function facultyYearOptions(\App\Models\Faculty $faculty): array
    {
        return Research::query()
            ->whereNull('archived_at')
            ->where(function ($query) use ($faculty) {
                $query->where('research_adviser', $faculty->id)
                    ->orWhereHas('panelists', fn ($panelQuery) => $panelQuery->where('faculties.id', $faculty->id));
            })
            ->whereNotNull('completed_year')
            ->selectRaw('completed_year, COUNT(*) as count')
            ->groupBy('completed_year')
            ->orderBy('completed_year', 'desc')
            ->get()
            ->map(fn ($row) => [
                'year' => (int) $row->completed_year,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();
    }

    private function facultyProgramOptions(\App\Models\Faculty $faculty): array
    {
        return Program::query()
            ->whereIn('id', Research::query()
                ->whereNull('archived_at')
                ->where(function ($query) use ($faculty) {
                    $query->where('research_adviser', $faculty->id)
                        ->orWhereHas('panelists', fn ($panelQuery) => $panelQuery->where('faculties.id', $faculty->id));
                })
                ->whereNotNull('program_id')
                ->select('program_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($program) => [
                'id' => (int) $program->id,
                'name' => $program->name,
                'code' => $program->code,
                'research_count' => 0,
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

        $startYear = (int) $request->input('year_start', 0);
        $endYear = (int) $request->input('year_end', 0);

        if ($startYear && $endYear) {
            if ($startYear > $endYear) {
                [$startYear, $endYear] = [$endYear, $startYear];
            }

            $years = range($startYear, $endYear);
        }

        $programs = collect((array) $request->input('program', $request->input('programs', [])))
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
            $advisedQuery->whereIn('completed_year', $years);
            $paneledQuery->whereIn('completed_year', $years);
        }

        if (! empty($programs)) {
            $advisedQuery->whereIn('program_id', $programs);
            $paneledQuery->whereIn('program_id', $programs);
        }

        $yearlyTrendAdvised = (clone $advisedQuery)
            ->selectRaw('completed_year as year, COUNT(*) as count')
            ->groupBy('completed_year')
            ->orderBy('completed_year')
            ->get()
            ->map(fn ($row) => ['year' => (int) $row->year, 'count' => (int) $row->count])
            ->values()
            ->all();

        $yearlyTrendPaneled = (clone $paneledQuery)
            ->selectRaw('completed_year as year, COUNT(*) as count')
            ->groupBy('completed_year')
            ->orderBy('completed_year')
            ->get()
            ->map(fn ($row) => ['year' => (int) $row->year, 'count' => (int) $row->count])
            ->values()
            ->all();

        $advisedTotal = (int) $advisedQuery->count();
        $alignmentSummary = $this->alignmentService->calculateAlignmentSummary($advisedQuery, $advisedTotal);
        $alignmentBreakdown = $this->alignmentService->calculateAlignmentBreakdown((clone $advisedQuery)->select('id'), $advisedTotal);

        return [
            'totals' => [
                'advised' => $advisedTotal,
                'paneled' => $paneledQuery->count(),
            ],
            'yearlyTrendAdvised' => $yearlyTrendAdvised,
            'yearlyTrendPaneled' => $yearlyTrendPaneled,
            'alignmentSummary' => $alignmentSummary->values()->all(),
            'alignmentBreakdown' => $alignmentBreakdown->values()->all(),
            'alignmentTotal' => $advisedTotal,
            'lastUpdated' => Research::query()->whereNull('archived_at')->max('updated_at') ? (string) Research::query()->whereNull('archived_at')->max('updated_at') : null,
        ];
    }

    public function programTrend(Program $program): JsonResponse
    {
        $this->authorize('viewStatistics', Research::class);

        $data = Research::query()
            ->where('program_id', $program->id)
            ->whereNotNull('completed_year')
            ->select([
                DB::raw('completed_year as year'),
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy('completed_year')
            ->orderBy('completed_year')
            ->get();

        return response()->json(['data' => $data]);
    }
}
