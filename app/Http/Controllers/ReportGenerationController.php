<?php

namespace App\Http\Controllers;

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Services\Reports\CompiledReportService;
use App\Services\Reports\MatrixReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportGenerationController extends Controller
{
    public function __construct(
        private readonly MatrixReportService $matrixReportService,
        private readonly CompiledReportService $compiledReportService,
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): Response
    {
        $filters = $request->only(['program', 'year', 'adviser', 'status']);

        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'sdgs', 'srigs', 'agendas'])
            ->active();

        if (!empty($filters['program'])) {
            $query->byProgram($filters['program']);
        }

        if (!empty($filters['year'])) {
            $query->byYear($filters['year']);
        }

        if (!empty($filters['adviser'])) {
            $query->byAdviser($filters['adviser']);
        }

        if (!empty($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        $records = $query
            ->orderByDesc('completed_year')
            ->orderByDesc('completed_month')
            ->get();

        $advisers = Faculty::whereIn(
            'id',
            Research::whereNotNull('research_adviser')
                ->distinct()
                ->pluck('research_adviser')
        )
            ->select('id', 'first_name', 'middle_name', 'last_name')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('reports/index', [
            'records' => $records,
            'programs' => Program::select('id', 'name')->orderBy('name')->get(),
            'advisers' => $advisers,
            'years' => Research::query()
                ->active()
                ->whereNotNull('completed_year')
                ->distinct()
                ->orderByDesc('completed_year')
                ->pluck('completed_year'),
            'statuses' => array_map(
                static fn (ResearchStatus $status) => $status->value,
                array_filter(
                    ResearchStatus::cases(),
                    static fn (ResearchStatus $status) => $status !== ResearchStatus::ARCHIVED
                )
            ),
            'filters' => $filters,
        ]);
    }

    public function exportMatrix(Request $request)
    {
        return $this->matrixReportService->export(
            $request->input('format', 'pdf'),
            $request->only(['program', 'year', 'adviser', 'status']),
            $request->boolean('preview'),
        );
    }

    public function exportCompiled(Request $request)
    {
        return $this->compiledReportService->export(
            $request->input('format', 'pdf'),
            $request->only(['program', 'year', 'adviser', 'status']),
            $request->boolean('preview'),
        );
    }
}