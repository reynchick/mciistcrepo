<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Models\ResearchAccessLog;
use App\Models\KeywordSearchLog;
use App\Repositories\ResearchRepository;
use App\Services\Statistics\CollegeStatisticsService;
use App\Services\Statistics\ProgramStatisticsService;
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

    public function index(Request $request): Response
    {
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
}
