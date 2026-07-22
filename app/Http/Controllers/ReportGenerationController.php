<?php

namespace App\Http\Controllers;

use App\Enums\ResearchStatus;
use App\Models\CompiledReport;
use App\Models\ReportType;
use App\Models\ReportFormat;
use App\Models\Research;
use App\Models\Faculty;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;
use Inertia\Inertia;
use Inertia\Response;

class ReportGenerationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request): Response
    {
        // Research Matrix Generator
        $filters = $request->only(['search', 'program', 'year', 'status_filter']);
        $statusFilter = $this->resolveStatusFilter($request);
        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'sdgs', 'srigs', 'agendas']);

        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('research_title', 'LIKE', "%{$s}%")
                    ->orWhere('research_abstract', 'LIKE', "%{$s}%")
                    ->orWhereHas('adviser', function ($a) use ($s) {
                        $a->where('first_name', 'LIKE', "%{$s}%")
                          ->orWhere('last_name', 'LIKE', "%{$s}%");
                    })
                    ->orWhereHas('researchers', function ($r) use ($s) {
                        $r->where('first_name', 'LIKE', "%{$s}%")
                          ->orWhere('last_name', 'LIKE', "%{$s}%");
                    })
                    ->orWhereHas('keywords', function ($k) use ($s) {
                        $k->where('keyword_name', 'LIKE', "%{$s}%");
                    });
            });
        }

        if (!empty($filters['program'])) {
            $query->where('program_id', $filters['program']);
        }

        if (!empty($filters['year'])) {
            $query->where('published_year', $filters['year']);
        }

        $records = $query
            ->orderByDesc('published_year')
            ->orderByDesc('published_month')
            ->get();

        return Inertia::render('reports/index', [
            'records' => $records,
            'programs' => Program::select('id', 'name')->orderBy('name')->get(),
            'years' => Research::query()->whereNotNull('published_year')->when($statusFilter !== 'all', fn ($query) => $query->where('status', $statusFilter))->distinct()->orderByDesc('published_year')->pluck('published_year'),
            'filters' => $filters + ['status_filter' => $statusFilter],
        ]);
    }

    public function exportPdf(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        if (!Auth::user()?->isAdministrator()) {
            abort(403);
        }

        \Log::info('PDF Export started', ['filters' => $request->all()]);
        
        $filters = $request->only(['search', 'program', 'year', 'status_filter']);
        $statusFilter = $this->resolveStatusFilter($request);
        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'sdgs', 'srigs', 'agendas']);

        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('research_title', 'LIKE', "%{$s}%")
                    ->orWhere('research_abstract', 'LIKE', "%{$s}%")
                    ->orWhereHas('adviser', function ($a) use ($s) {
                        $a->where('first_name', 'LIKE', "%{$s}%")
                          ->orWhere('last_name', 'LIKE', "%{$s}%");
                    })
                    ->orWhereHas('researchers', function ($r) use ($s) {
                        $r->where('first_name', 'LIKE', "%{$s}%")
                          ->orWhere('last_name', 'LIKE', "%{$s}%");
                    })
                    ->orWhereHas('keywords', function ($k) use ($s) {
                        $k->where('keyword_name', 'LIKE', "%{$s}%");
                    });
            });
        }

        if (!empty($filters['program'])) {
            $query->where('program_id', $filters['program']);
        }

        if (!empty($filters['year'])) {
            $query->where('published_year', $filters['year']);
        }

        $records = $query
            ->orderByDesc('published_year')
            ->orderByDesc('published_month')
            ->get();

        // Group records by program and year
        $groupedRecords = $records->groupBy(function ($record) {
            return $record->program->name ?? 'No Program';
        })->map(function ($programGroup) {
            return $programGroup->groupBy(function ($record) {
                return $record->published_year ?? 'Unknown Year';
            });
        });

        // Generate HTML for PDF
        $html = $this->generateMatrixHtml($groupedRecords, $filters + ['status_filter' => $statusFilter]);

        $filename = 'research_matrix_' . now()->format('Ymd_His') . '.pdf';

        try {
            $tempPath = $this->generatePdf($html, $filename, [
                'orientation' => 'L',
                'margin_left' => 10,
                'margin_right' => 10,
                'margin_top' => 10,
                'margin_bottom' => 10,
            ]);

            return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            // Log the error with more details
            \Log::error('PDF Generation Error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            \Log::error('Base path: ' . base_path());
            \Log::error('Temp path: ' . $tempPath);
            
            // Return error response with more details
            return response()->json([
                'error' => 'Failed to generate PDF',
                'message' => $e->getMessage(),
                'details' => 'Please check the Laravel logs for more information.'
            ], 500);
        }
    }

    public function exportCompilation(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        if (!Auth::user()?->isAdministrator()) {
            abort(403);
        }

        \Log::info('Compilation PDF Export started', ['filters' => $request->all()]);
        
        $filters = $request->only(['search', 'program', 'year', 'adviser', 'status_filter']);
        $statusFilter = $this->resolveStatusFilter($request);
        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'keywords']);

        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $query->where(function ($q) use ($s) {
                $q->where('research_title', 'LIKE', "%{$s}%")
                    ->orWhere('research_abstract', 'LIKE', "%{$s}%")
                    ->orWhereHas('adviser', function ($a) use ($s) {
                        $a->where('first_name', 'LIKE', "%{$s}%")
                          ->orWhere('last_name', 'LIKE', "%{$s}%");
                    })
                    ->orWhereHas('researchers', function ($r) use ($s) {
                        $r->where('first_name', 'LIKE', "%{$s}%")
                          ->orWhere('last_name', 'LIKE', "%{$s}%");
                    })
                    ->orWhereHas('keywords', function ($k) use ($s) {
                        $k->where('keyword_name', 'LIKE', "%{$s}%");
                    });
            });
        }

        if (!empty($filters['program'])) {
            $query->where('program_id', $filters['program']);
        }

        if (!empty($filters['year'])) {
            $query->where('published_year', $filters['year']);
        }

        $records = $query
            ->orderByDesc('published_year')
            ->orderByDesc('published_month')
            ->get();

        // Generate HTML for Book of Abstracts
        $html = $this->generateCompilationHtml($records, $filters + ['status_filter' => $statusFilter]);

        $filename = 'research_compilation_' . now()->format('Ymd_His') . '.pdf';

        try {
            $tempPath = $this->generatePdf($html, $filename, [
                'orientation' => 'P',
                'margin_left' => 0,
                'margin_right' => 0,
                'margin_top' => 0,
                'margin_bottom' => 0,
            ]);

            return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            \Log::error('Compilation PDF Generation Error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'error' => 'Failed to generate compilation PDF',
                'message' => $e->getMessage(),
                'details' => 'Please check the Laravel logs for more information.'
            ], 500);
        }
    }

    private function generateCompilationHtml($records, $filters): string
    {
        // Prepare applied filters for display
        $appliedFilters = [];
        
        if (!empty($filters['search'])) {
            $appliedFilters['search'] = $filters['search'];
        }
        
        if (!empty($filters['program'])) {
            $program = Program::find($filters['program']);
            if ($program) {
                $appliedFilters['program'] = $program->name;
            }
        }
        
        if (!empty($filters['year'])) {
            $appliedFilters['year'] = $filters['year'];
        }

        if (!empty($filters['adviser'])) {
            $adviser = \App\Models\Faculty::find($filters['adviser']);
            if ($adviser) {
                $appliedFilters['adviser'] = trim(($adviser->first_name ?? '') . ' ' . ($adviser->last_name ?? ''));
            }
        }

        if (!empty($filters['status_filter'])) {
            $statusFilter = $filters['status_filter'];
            $appliedFilters['status'] = $statusFilter === 'all'
                ? 'All statuses'
                : ucfirst($statusFilter);
        }

        // Calculate date range using research months when available
        $dateRange = '';
        
        if ($records->count() > 0) {
            $dates = $records->filter(function($r) {
                return $r->published_year && $r->published_month;
            })->map(function($r) {
                return \Carbon\Carbon::create($r->published_year, $r->published_month, 1);
            })->sort();
            
            if ($dates->count() > 0) {
                $minDate = $dates->first();
                $maxDate = $dates->last();
                
                if ($minDate->isSameMonth($maxDate)) {
                    $dateRange = $minDate->format('F Y');
                } else {
                    $dateRange = $minDate->format('F Y') . ' - ' . $maxDate->format('F Y');
                }
            } else {
                // Fallback to years only if no month data
                $years = $records->pluck('published_year')->filter()->unique()->sort();
                if ($years->count() > 0) {
                    if ($years->count() == 1) {
                        $dateRange = $years->first();
                    } else {
                        $dateRange = $years->first() . ' - ' . $years->last();
                    }
                }
            }
        }

        // Group researches by program for TOC
        $groupedByProgram = $records->groupBy(function($research) {
            return $research->program ? $research->program->name : 'Uncategorized';
        });

        return view('reports.compilation-pdf', [
            'researches' => $records,
            'groupedByProgram' => $groupedByProgram,
            'appliedFilters' => $appliedFilters,
            'dateRange' => $dateRange,
            'showStatusBadge' => ($filters['status_filter'] ?? 'published') === 'all',
        ])->render();
    }

    private function generateMatrixHtml($groupedRecords, $filters): string
    {
        $monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

        $html = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Research Matrix Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            color: #1e40af;
            font-size: 24pt;
        }
        .header .subtitle {
            color: #64748b;
            font-size: 11pt;
        }
        .filters {
            background: #f8fafc;
            padding: 10px 15px;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
            font-size: 9pt;
        }
        .filters strong {
            color: #1e40af;
        }
        .program-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .program-header {
            background: #1e40af;
            color: white;
            padding: 10px 15px;
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .year-section {
            margin-bottom: 20px;
        }
        .year-header {
            background: #e0e7ff;
            padding: 8px 15px;
            font-size: 11pt;
            font-weight: bold;
            color: #1e40af;
            border-left: 4px solid #3b82f6;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 8.5pt;
        }
        th {
            background: #f1f5f9;
            color: #1e293b;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #cbd5e1;
        }
        td {
            padding: 6px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 7.5pt;
            margin-right: 4px;
            margin-bottom: 2px;
        }
        .researcher-list {
            line-height: 1.4;
        }
        .empty-cell {
            color: #94a3b8;
            font-style: italic;
            font-size: 7.5pt;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #cbd5e1;
            text-align: center;
            font-size: 8pt;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Research Matrix Report</h1>
        <div class="subtitle">Generated on ' . now()->format('F d, Y h:i A') . '</div>
    </div>
';

        // Display active filters
        if (!empty($filters['search']) || !empty($filters['program']) || !empty($filters['year']) || !empty($filters['status_filter'])) {
            $html .= '    <div class="filters">
        <strong>Active Filters:</strong> ';
            $filterParts = [];
            if (!empty($filters['search'])) $filterParts[] = 'Search: "' . htmlspecialchars($filters['search']) . '"';
            if (!empty($filters['program'])) {
                $program = Program::find($filters['program']);
                $filterParts[] = 'Program: ' . ($program ? htmlspecialchars($program->name) : 'Unknown');
            }
            if (!empty($filters['year'])) $filterParts[] = 'Year: ' . htmlspecialchars($filters['year']);
            if (!empty($filters['status_filter'])) {
                $statusLabel = $filters['status_filter'] === 'all' ? 'All statuses' : ucfirst($filters['status_filter']);
                $filterParts[] = 'Status: ' . htmlspecialchars($statusLabel);
            }
            $html .= implode(' | ', $filterParts);
            $html .= '
    </div>
';
        }

        // Generate grouped content
        foreach ($groupedRecords as $programName => $yearGroups) {
            $html .= '    <div class="program-section">
';
            $html .= '        <div class="program-header">' . htmlspecialchars($programName) . '</div>
';

            foreach ($yearGroups as $year => $researches) {
                $html .= '        <div class="year-section">
';
                $html .= '            <div class="year-header">Year: ' . htmlspecialchars($year) . ' (' . count($researches) . ' record' . (count($researches) != 1 ? 's' : '') . ')</div>
';
                $html .= '            <table>
';
                $html .= '                <thead>
';
                $html .= '                    <tr>
';
                $html .= '                        <th style="width: 4%;">ID</th>
';
                $html .= '                        <th style="width: 20%;">Title</th>
';
                $html .= '                        <th style="width: 15%;">Researchers</th>
';
                $html .= '                        <th style="width: 10%;">Adviser</th>
';
                $html .= '                        <th style="width: 8%;">Date</th>
';
                $html .= '                        <th style="width: 14%;">SDG</th>
';
                $html .= '                        <th style="width: 14%;">SRIG</th>
';
                $html .= '                        <th style="width: 8%;">Status</th>
';
                $html .= '                        <th style="width: 15%;">Research Agenda</th>
';
                $html .= '                    </tr>
';
                $html .= '                </thead>
';
                $html .= '                <tbody>
';

                foreach ($researches as $research) {
                    $html .= '                    <tr>
';
                    $html .= '                        <td>' . htmlspecialchars($research->id) . '</td>
';
                    $html .= '                        <td>' . htmlspecialchars($research->research_title) . '</td>
';
                    
                    // Researchers
                    $html .= '                        <td><div class="researcher-list">';
                    if ($research->researchers && $research->researchers->count() > 0) {
                        foreach ($research->researchers as $researcher) {
                            $middle = $researcher->middle_name ? ' ' . substr($researcher->middle_name, 0, 1) . '.' : '';
                            $html .= htmlspecialchars($researcher->first_name . $middle . ' ' . $researcher->last_name) . '<br>';
                        }
                    } else {
                        $html .= '<span class="empty-cell">No researchers</span>';
                    }
                    $html .= '</div></td>
';
                    
                    // Adviser
                    $html .= '                        <td>';
                    if ($research->adviser) {
                        $middle = $research->adviser->middle_name ? ' ' . substr($research->adviser->middle_name, 0, 1) . '.' : '';
                        $html .= htmlspecialchars($research->adviser->first_name . $middle . ' ' . $research->adviser->last_name);
                    } else {
                        $html .= '<span class="empty-cell">N/A</span>';
                    }
                    $html .= '</td>
';
                    
                    // Date
                    $html .= '                        <td>';
                    if ($research->published_year) {
                        if ($research->published_month) {
                            $html .= htmlspecialchars($monthNames[$research->published_month] . ' ' . $research->published_year);
                        } else {
                            $html .= htmlspecialchars($research->published_year);
                        }
                    } else {
                        $html .= '<span class="empty-cell">N/A</span>';
                    }
                    $html .= '</td>
';
                    
                    // SDGs
                    $html .= '                        <td>';
                    if ($research->sdgs && $research->sdgs->count() > 0) {
                        foreach ($research->sdgs as $sdg) {
                            $html .= '<span class="badge">' . htmlspecialchars($sdg->name) . '</span>';
                        }
                    } else {
                        $html .= '<span class="empty-cell">None</span>';
                    }
                    $html .= '</td>
';
                    
                    // SRIGs
                    $html .= '                        <td>';
                    if ($research->srigs && $research->srigs->count() > 0) {
                        foreach ($research->srigs as $srig) {
                            $html .= '<span class="badge">' . htmlspecialchars($srig->name) . '</span>';
                        }
                    } else {
                        $html .= '<span class="empty-cell">None</span>';
                    }
                    $html .= '</td>
';
                    
                    // Status
                    $html .= '                        <td>';
                    $statusLabel = $research->displayStatusLabel();
                    $html .= '<span class="badge">' . htmlspecialchars($statusLabel) . '</span>';
                    $html .= '</td>
';

                    // Research Agendas
                    $html .= '                        <td>';
                    if ($research->agendas && $research->agendas->count() > 0) {
                        foreach ($research->agendas as $agenda) {
                            $html .= '<span class="badge">' . htmlspecialchars($agenda->name) . '</span>';
                        }
                    } else {
                        $html .= '<span class="empty-cell">None</span>';
                    }
                    $html .= '</td>
';
                    
                    $html .= '                    </tr>
';
                }

                $html .= '                </tbody>
';
                $html .= '            </table>
';
                $html .= '        </div>
';
            }

            $html .= '    </div>
';
        }

        $html .= '    <div class="footer">
';
        $html .= '        Research Matrix Report | Total Records: ' . $groupedRecords->flatten(2)->count() . '
';
        $html .= '    </div>
';
        $html .= '</body>
</html>
';

        return $html;
    }

    public function compilation(Request $request): JsonResponse
    {
        $filters = $this->filters($request);
        $items = $this->queryResearch($filters)->with(['program', 'adviser', 'researchers', 'keywords'])->get();

        $rtf = $this->toRtfCompilation($items);
        $filename = 'compilation_' . now()->format('Ymd_His') . '.rtf';
        $path = Storage::put('compiled/' . $filename, $rtf) ? ('compiled/' . $filename) : null;

        $typeId = ReportType::where('name', 'Abstract/Executive Summary Compilation')->value('id');
        $formatId = ReportFormat::where('name', 'Word')->value('id');

        $compiled = CompiledReport::create([
            'report_type_id' => $typeId,
            'report_format_id' => $formatId,
            'generated_by' => Auth::id(),
            'generated_on' => now(),
            'filters_applied' => $filters,
            'file_path' => $path,
        ]);

        return response()->json([
            'compiledReportId' => $compiled->id,
            'fileUrl' => route('compiled-reports.download', $compiled),
        ]);
    }

    public function generate(Request $request): JsonResponse
    {
        $filters = $this->filters($request);
        $format = strtolower($request->input('format', 'pdf')); // 'pdf' | 'xlsx'
        $columns = (array) $request->input('columns', []);

        $items = $this->queryResearch($filters)->with(['program', 'adviser'])->get();

        if ($format === 'xlsx') {
            $csv = $this->toCsv($items, $columns);
            $filename = 'report_' . now()->format('Ymd_His') . '.csv';
            $path = Storage::put('compiled/' . $filename, $csv) ? ('compiled/' . $filename) : null;
            $formatId = ReportFormat::where('name', 'Excel')->value('id');
        } else {
            $html = $this->toHtmlTable($items, $columns);
            $filename = 'report_' . now()->format('Ymd_His') . '.html';
            $path = Storage::put('compiled/' . $filename, $html) ? ('compiled/' . $filename) : null;
            $formatId = ReportFormat::where('name', 'PDF')->value('id'); // swap to real PDF later
        }

        $typeId = ReportType::where('name', 'Tabular Report')->value('id');

        $compiled = CompiledReport::create([
            'report_type_id' => $typeId,
            'report_format_id' => $formatId,
            'generated_by' => Auth::id(),
            'generated_on' => now(),
            'filters_applied' => $filters,
            'file_path' => $path,
        ]);

        return response()->json([
            'compiledReportId' => $compiled->id,
            'fileUrl' => route('compiled-reports.download', $compiled),
        ]);
    }

    private function filters(Request $request): array
    {
        return array_filter([
            'search' => $request->input('search'),
            'program' => $request->input('program'),
            'year' => $request->input('year'),
            'adviser' => $request->input('adviser'),
            'status_filter' => $this->resolveStatusFilter($request),
            'startDate' => $request->input('startDate'),
            'endDate' => $request->input('endDate'),
            'alignment' => $request->input('alignment'),
        ], fn($v) => $v !== null && $v !== '');
    }

    private function queryResearch(array $filters)
    {
        $q = Research::query()->with(['program', 'adviser']);
        $statusFilter = $filters['status_filter'] ?? 'published';

        if ($statusFilter !== 'all') {
            $q->where('status', $statusFilter);
        }

        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $q->where(function ($w) use ($s) {
                $w->where('research_title', 'LIKE', "%{$s}%")
                  ->orWhereHas('keywords', fn($k) => $k->where('keyword', 'LIKE', "%{$s}%"));
            });
        }
        if (!empty($filters['year'])) {
            $q->where('published_year', $filters['year']);
        }
        if (!empty($filters['adviser'])) {
            $q->whereHas('adviser', fn($a) => $a->where('id', $filters['adviser']));
        }
        if (!empty($filters['program'])) {
            $q->whereHas('program', fn($p) => $p->where('id', $filters['program']));
        }
        if (!empty($filters['alignment'])) {
            if ($filters['alignment'] === 'sdg') $q->whereHas('sdgs');
            if ($filters['alignment'] === 'srig') $q->whereHas('srigs');
            if ($filters['alignment'] === 'agenda') $q->whereHas('agendas');
        }
        if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
            $q->whereBetween('created_at', [$filters['startDate'], $filters['endDate']]);
        }

        return $q;
    }

    private function resolveStatusFilter(Request $request): string
    {
        $statusFilter = strtolower((string) $request->input('status_filter', 'published'));

        return in_array($statusFilter, ['all', 'draft', 'submitted', 'published', 'returned', 'archived'], true)
            ? $statusFilter
            : 'published';
    }

    private function toRtfCompilation($items): string
    {
        $rtf = "{\\rtf1\\ansi\\deff0\n";
        foreach ($items as $i) {
            $title = $this->escapeRtf($i->research_title ?? '');
            $prog = $this->escapeRtf($i->program->name ?? '');
            $adv = $this->escapeRtf(($i->adviser->last_name ?? '') . ', ' . ($i->adviser->first_name ?? ''));
            $date = $this->escapeRtf(($i->published_month ?? '') . ' ' . ($i->published_year ?? ''));
            $abstract = $this->escapeRtf($i->research_abstract ?? '');
            $keywords = $this->escapeRtf(($i->keywords?->pluck('keyword')->implode(', ')) ?? '');

            $rtf .= "\\b {$title} \\b0\\line ";
            $rtf .= "{$prog} • Adviser: {$adv} • {$date}\\line ";
            $rtf .= "Keywords: {$keywords}\\line ";
            $rtf .= "{$abstract}\\par \\par ";
        }
        $rtf .= "}";
        return $rtf;
    }

    private function escapeRtf(string $s): string
    {
        return str_replace(['\\', '{', '}'], ['\\\\', '\\{', '\\}'], $s);
    }

    private function toCsv($items, array $columns): string
    {
        $cols = !empty($columns) ? $columns : ['number','title','month_year','adviser','researchers','program','agenda','srig','sdg'];
        $out = fopen('php://temp', 'w+');
        fputcsv($out, $cols);

        foreach ($items as $i) {
            $row = [];
            foreach ($cols as $c) {
                switch ($c) {
                    case 'number': $row[] = $i->id; break;
                    case 'title': $row[] = $i->research_title; break;
                    case 'month_year': $row[] = trim(($i->published_month ?? '') . ' ' . ($i->published_year ?? '')); break;
                    case 'adviser': $row[] = ($i->adviser->last_name ?? '') . ', ' . ($i->adviser->first_name ?? ''); break;
                    case 'researchers': $row[] = $i->researchers?->map(fn($r) => trim(($r->last_name ?? '') . ', ' . ($r->first_name ?? '')))->implode('; ') ?? ''; break;
                    case 'program': $row[] = $i->program->name ?? ''; break;
                    default: $row[] = ''; break;
                }
            }
            fputcsv($out, $row);
        }

        rewind($out);
        return stream_get_contents($out);
    }

    private function toHtmlTable($items, array $columns): string
    {
        $cols = !empty($columns) ? $columns : ['number','title','month_year','adviser','researchers','program'];
        $html = '<!doctype html><meta charset="utf-8"><table border="1"><thead><tr>';
        foreach ($cols as $c) $html .= '<th>'.htmlspecialchars($c).'</th>';
        $html .= '</tr></thead><tbody>';
        foreach ($items as $i) {
            $html .= '<tr>';
            foreach ($cols as $c) {
                $cell = '';
                switch ($c) {
                    case 'number': $cell = $i->id; break;
                    case 'title': $cell = $i->research_title; break;
                    case 'month_year': $cell = trim(($i->published_month ?? '').' '.($i->published_year ?? '')); break;
                    case 'adviser': $cell = ($i->adviser->last_name ?? '').', '.($i->adviser->first_name ?? ''); break;
                    case 'researchers': $cell = $i->researchers?->map(fn($r) => trim(($r->last_name ?? '').', '.($r->first_name ?? '')))->implode('; ') ?? ''; break;
                    case 'program': $cell = $i->program->name ?? ''; break;
                }
                $html .= '<td>'.htmlspecialchars($cell).'</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';
        return $html;
    }

    private function generatePdf(string $html, string $filename, array $settings = []): string
    {
        $tempDirectory = storage_path('app/temp');

        if (!is_dir($tempDirectory)) {
            mkdir($tempDirectory, 0755, true);
        }

        $mpdf = new Mpdf([
            'format' => 'A4',
            'orientation' => $settings['orientation'] ?? 'P',
            'margin_left' => $settings['margin_left'] ?? 10,
            'margin_right' => $settings['margin_right'] ?? 10,
            'margin_top' => $settings['margin_top'] ?? 10,
            'margin_bottom' => $settings['margin_bottom'] ?? 10,
            'tempDir' => $tempDirectory,
        ]);

        $mpdf->WriteHTML($html);
        $path = $tempDirectory . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($path, 'F');

        if (!file_exists($path)) {
            throw new \RuntimeException('PDF file was not created');
        }

        return $path;
    }
}