<?php

namespace App\Http\Controllers;

use App\Enums\ResearchStatus;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\Agenda;
use App\Models\SDG;
use App\Models\SRIG;
use App\Services\Reports\CompiledReportService;
use App\Services\Reports\MatrixReportService;
use App\Services\Reports\ResearchAlignmentReportService;
use App\Services\Reports\UsageReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportGenerationController extends Controller
{
    public function __construct(
        private readonly MatrixReportService $matrixReportService,
        private readonly CompiledReportService $compiledReportService,
        private readonly ResearchAlignmentReportService $researchAlignmentReportService,
        private readonly UsageReportService $usageReportService,
    ) {
        $this->middleware('auth');
    }

    public function index(Request $request): Response
    {
        $statusFilter = $request->input('status_filter', $request->input('status'));
        $filters = $request->only(['program', 'year', 'adviser', 'status', 'status_filter']);
        $filters['status'] = $statusFilter ?: ($filters['status'] ?? null);

        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'panelists', 'keywords', 'sdgs', 'srigs', 'agendas'])
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
            'panelists' => Faculty::whereHas('paneledResearch', function ($query) {
                $query->active();
            })
                ->select('id', 'first_name', 'middle_name', 'last_name')
                ->orderBy('first_name')
                ->get(),
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
        $filters = $request->only(['program', 'year', 'adviser', 'status', 'status_filter']);
        $filters['status'] = $request->input('status_filter', $request->input('status')) ?: ($filters['status'] ?? null);
        $filters['title'] = $request->input('title');
        $filters['researcher'] = $request->input('researcher');
        $filters['panelist'] = $request->input('panelist');
        $filters['keyword'] = $request->input('keyword');
        $filters['columns'] = $request->input('columns', []);
        $filters['alignment_category'] = $request->input('alignment_category', 'all');
        $filters['alignment_selections'] = $request->input('alignment_selections', []);

        $allowedColumns = [
            'title', 'abstract', 'completed_year', 'status', 'program',
            'adviser', 'researchers', 'panelists', 'keywords', 'alignment',
        ];
        $filters['columns'] = is_array($filters['columns'])
            ? array_values(array_intersect($filters['columns'], $allowedColumns))
            : [];

        if ($filters['columns'] === []) {
            return response()->json(['error' => 'Select at least one matrix column.'], 422);
        }

        if (!in_array($filters['alignment_category'], ['all', 'any', 'sdg', 'srig', 'agenda'], true)) {
            return response()->json(['error' => 'Invalid alignment category.'], 422);
        }

        $filters['alignment_selections'] = is_array($filters['alignment_selections'])
            ? array_values(array_filter($filters['alignment_selections'], static fn ($selection) => preg_match('/^(sdg|srig|agenda):\d+$/', (string) $selection)))
            : [];

        return $this->matrixReportService->export(
            $request->input('format', 'pdf'),
            $filters,
            $request->boolean('preview'),
        );
    }

    public function exportCompiled(Request $request)
    {
        $filters = $request->only(['program', 'year', 'adviser', 'status', 'status_filter']);
        $filters['status'] = $request->input('status_filter', $request->input('status')) ?: ($filters['status'] ?? null);

        return $this->compiledReportService->export(
            $request->input('format', 'pdf'),
            $filters,
            $request->boolean('preview'),
        );
    }

    /** Return server-computed alignment report results. */
    public function alignmentData(Request $request)
    {
        $filters = $this->alignmentFilters($request);
        $baseQuery = $this->alignmentResearchQuery($filters);
        $category = $filters['category'];
        [, $relation] = match ($category) {
            'srig' => [SRIG::class, 'srigs'],
            'agenda' => [Agenda::class, 'agendas'],
            default => [SDG::class, 'sdgs'],
        };
        $result = $this->researchAlignmentReportService->breakdownData($filters);
        $items = collect($result['items']);

        $papers = null;
        if ($request->filled('item_id')) {
            $itemId = (int) $request->input('item_id');
            abort_unless($items->contains('id', $itemId), 404);
            $papers = (clone $baseQuery)
                ->whereHas($relation, fn ($query) => $query->where($relation.'.id', $itemId))
                ->with(['program:id,name', 'adviser:id,first_name,middle_name,last_name'])
                ->orderByDesc('completed_year')
                ->orderBy('research_title')
                ->get(['id', 'research_title', 'program_id', 'research_adviser', 'completed_year', 'status'])
                ->map(fn (Research $research) => [
                    'id' => $research->id,
                    'title' => $research->research_title,
                    'program' => $research->program?->name,
                    'adviser' => trim(implode(' ', array_filter([$research->adviser?->first_name, $research->adviser?->middle_name, $research->adviser?->last_name]))),
                    'year' => $research->completed_year,
                    'status' => $research->getRawOriginal('status') === 'draft_invited'
                        ? 'Draft (Invited)'
                        : $research->status->label(),
                ]);
        }

        return response()->json([
            'category' => $result['category'],
            'matchingPapers' => $result['matchingPapers'],
            'itemsShown' => $result['itemsShown'],
            'itemsWithPapers' => $result['itemsWithPapers'],
            'items' => $items,
            'papers' => $papers,
        ]);
    }

    public function previewAlignment(Request $request)
    {
        $filters = $this->alignmentExportFilters($request);
        return $this->researchAlignmentReportService->export('pdf', $filters, true);
    }

    public function exportAlignment(Request $request)
    {
        $filters = $this->alignmentExportFilters($request);
        $format = $request->validate(
            ['format' => ['required', 'in:pdf,docx']],
            ['format.in' => 'The format must be PDF or DOCX.'],
        )['format'];

        return $this->researchAlignmentReportService->export($format, $filters);
    }

    public function usageData(Request $request)
    {
        return response()->json($this->usageReportService->data($this->usageFilters($request)));
    }

    public function previewUsage(Request $request)
    {
        $filters = $this->usageFilters($request);
        return $this->usageReportService->export($filters, 'pdf', true);
    }

    public function exportUsage(Request $request)
    {
        $filters = $this->usageFilters($request);
        $format = $request->validate(
            ['format' => ['required', 'in:pdf,docx']],
            ['format.in' => 'The format must be PDF or DOCX.'],
        )['format'];
        return $this->usageReportService->export($filters, $format);
    }

    private function usageFilters(Request $request): array
    {
        $validated = $request->validate([
            'type' => ['required', 'in:keywords,access'],
            'date_range' => ['required', 'in:last_30_days,last_90_days,last_12_months,all'],
            'show' => ['required', 'in:top_5,top_10,all'],
            'term' => ['nullable', 'string', 'max:255'],
            'program' => ['nullable', 'integer', 'exists:programs,id'],
        ]);

        return [
            'type' => $validated['type'],
            'date_range' => $validated['date_range'],
            'show' => $validated['show'],
            'term' => trim((string) ($validated['term'] ?? '')),
            'program' => $validated['program'] ?? null,
        ];
    }

    private function alignmentExportFilters(Request $request): array
    {
        $validated = $request->validate([
            'category' => ['required', 'in:sdg,srig,agenda'],
            'year' => ['nullable', 'integer'],
            'program' => ['nullable', 'integer'],
            'adviser' => ['nullable', 'integer'],
            'status' => ['required', 'in:all,draft,draft_invited,submitted,returned,posted'],
            'items' => ['nullable', 'array'],
            'items.*' => ['integer'],
        ]);

        return [
            'category' => $validated['category'],
            'year' => $validated['year'] ?? null,
            'program' => $validated['program'] ?? null,
            'adviser' => $validated['adviser'] ?? null,
            'status' => $validated['status'],
            'items' => array_values(array_unique(array_map('intval', $validated['items'] ?? []))),
        ];
    }

    private function alignmentFilters(Request $request): array
    {
        $validated = $request->validate([
            'category' => ['nullable', 'in:sdg,srig,agenda'],
            'year' => ['nullable', 'integer'],
            'program' => ['nullable', 'integer'],
            'adviser' => ['nullable', 'integer'],
            'status' => ['nullable', 'in:all,draft,draft_invited,submitted,returned,posted'],
            'items' => ['nullable', 'array'],
            'items.*' => ['integer'],
            'item_id' => ['nullable', 'integer'],
        ]);

        return [
            'category' => $validated['category'] ?? 'sdg',
            'year' => $validated['year'] ?? null,
            'program' => $validated['program'] ?? null,
            'adviser' => $validated['adviser'] ?? null,
            'status' => $validated['status'] ?? 'posted',
            'items' => array_values(array_unique(array_map('intval', $validated['items'] ?? []))),
        ];
    }

    private function alignmentResearchQuery(array $filters)
    {
        return Research::query()->active()->whereNull('archived_at')
            ->when($filters['year'], fn ($query, $year) => $query->where('completed_year', $year))
            ->when($filters['program'], fn ($query, $program) => $query->where('program_id', $program))
            ->when($filters['adviser'], fn ($query, $adviser) => $query->where('research_adviser', $adviser))
            ->when($filters['status'] !== 'all', fn ($query) => $query->where('status', $filters['status']));
    }

}
