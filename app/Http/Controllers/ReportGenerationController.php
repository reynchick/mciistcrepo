<?php

namespace App\Http\Controllers;

use App\Models\CompiledReport;
use App\Models\ReportType;
use App\Models\ReportFormat;
use App\Models\Research;
use App\Models\Faculty;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
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
        $filters = $request->only(['program', 'year', 'adviser', 'status']);

        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'sdgs', 'srigs', 'agendas'])
            ->whereNull('archived_at');

        if (!empty($filters['program'])) {
            $query->where('program_id', $filters['program']);
        }
        if (!empty($filters['year'])) {
            $query->where('published_year', $filters['year']);
        }
        if (!empty($filters['adviser'])) {
            $query->where('adviser_id', $filters['adviser']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $records = $query
            ->orderByDesc('published_year')
            ->orderByDesc('published_month')
            ->get();

        $advisers = Faculty::whereIn('id', Research::whereNotNull('research_adviser')->distinct('research_adviser')->pluck('research_adviser'))
            ->select('id', 'first_name', 'middle_name', 'last_name')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('reports/index', [
            'records' => $records,
            'programs' => Program::select('id', 'name')->orderBy('name')->get(),
            'advisers' => $advisers,
            'years' => Research::whereNotNull('published_year')->distinct()->orderByDesc('published_year')->pluck('published_year'),
            'statuses' => ['N/A'],
            'filters' => $filters,
        ]);
    }

    public function exportMatrix(Request $request)
    {
        $format = $request->input('format', 'pdf');
        $filters = $request->only(['program', 'year', 'adviser', 'status']);

        $grouped = $this->getGroupedMatrixData($filters);
        $totalCount = $grouped->flatten()->count();

        return match ($format) {
            'pdf'   => $this->generateMatrixPdf($grouped, $totalCount),
            'docx'  => $this->generateMatrixDocx($grouped, $totalCount),
            'excel' => $this->generateMatrixExcel($grouped, $totalCount),
            default => response()->json(['error' => 'Invalid format'], 422),
        };
    }

    public function exportCompiled(Request $request)
    {
        $format = $request->input('format', 'pdf');
        $filters = $request->only(['program', 'year', 'adviser', 'status']);

        $grouped = $this->getGroupedCompiledData($filters);
        $totalCount = $grouped->flatten()->count();

        return match ($format) {
            'pdf'   => $this->generateCompiledPdf($grouped, $totalCount),
            'docx'  => $this->generateCompiledDocx($grouped, $totalCount),
            'excel' => $this->generateCompiledExcel($grouped, $totalCount),
            default => response()->json(['error' => 'Invalid format'], 422),
        };
    }

    // -------------------------------------------------------------------
    // Shared helpers
    // -------------------------------------------------------------------

    private function getGroupedMatrixData(array $filters)
    {
        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'sdgs', 'srigs', 'agendas', 'keywords', 'panelists'])
            ->whereNull('archived_at');

        if (!empty($filters['program'])) {
            $query->where('program_id', $filters['program']);
        }
        if (!empty($filters['year'])) {
            $query->where('published_year', $filters['year']);
        }
        if (!empty($filters['adviser'])) {
            $query->where('adviser_id', $filters['adviser']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $records = $query
            ->orderBy('published_year')
            ->orderBy('published_month')
            ->get();

        return $records->groupBy(function ($r) {
            return $r->published_year ?? 'Unknown Year';
        })->sortKeys();
    }

    // -------------------------------------------------------------------
    // Compiled - Helpers
    // -------------------------------------------------------------------

    private function getGroupedCompiledData(array $filters)
    {
        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'sdgs', 'srigs', 'agendas', 'keywords', 'panelists'])
            ->whereNull('archived_at');

        if (!empty($filters['program'])) {
            $query->where('program_id', $filters['program']);
        }
        if (!empty($filters['year'])) {
            $query->where('published_year', $filters['year']);
        }
        if (!empty($filters['adviser'])) {
            $query->where('adviser_id', $filters['adviser']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $records = $query
            ->orderBy('published_year')
            ->orderBy('published_month')
            ->get();

        // Group by program, then by year within program
        return $records->groupBy(function ($r) {
            return $r->program->name ?? 'Uncategorized';
        })->map(function ($programGroup) {
            return $programGroup->groupBy(function ($r) {
                return $r->published_year ?? 'Unknown Year';
            })->sortKeys();
        });
    }

    private function formatPeople($people, $nameFields = ['first_name', 'middle_name', 'last_name'])
    {
        if (!$people) return 'N/A';
        $people = $people->filter(); // drop null entries (e.g. missing adviser)
        if ($people->isEmpty()) return 'N/A';
        return $people->map(function ($p) {
            $middle = !empty($p->middle_name) ? ' ' . substr($p->middle_name, 0, 1) . '.' : '';
            return trim("{$p->first_name}{$middle} {$p->last_name}");
        })->implode(', ');
    }

    private function formatTagList($items, $field = 'name')
    {
        if (!$items || $items->isEmpty()) return 'None';
        return $items->pluck($field)
            ->map(fn($v) => $this->sanitizeText($v))
            ->implode(', ');
    }

    private function formatMonthYear(?int $month, ?int $year): string
    {
        if (!$year) return 'N/A';
        if (!$month) return (string) $year;
        $months = ['', 'January','February','March','April','May','June','July','August','September','October','November','December'];
        return "{$months[$month]} {$year}";
    }

    private function ensureTempDir(): string
    {
        $dir = storage_path('app/temp');
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    private function sanitizeText($text): string
    {
        if ($text === null) return '';
        $text = (string) $text;

        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8'); // force-drop invalid bytes
        }

        // Strip control characters that break XML (keep normal whitespace)
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? $text;

        // Escape bare ampersands that aren't already a valid XML entity
        // (fixes "R& D", "Rice & Corn", etc. causing xmlParseEntityRef errors)
        $text = preg_replace('/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9A-Fa-f]+;)/', '&amp;', $text) ?? $text;

        return $text;
    }

    // -------------------------------------------------------------------
    // Matrix - PDF
    // -------------------------------------------------------------------

    private function generateMatrixPdf($grouped, int $totalCount)
    {
        $generatedOn = now()->format('F j, Y h:i A');

        $html = '<style>
            body { font-family: sans-serif; font-size: 9px; }
            .title-page { text-align: center; margin-top: 250px; }
            .title-page h1 { font-size: 22px; margin-bottom: 4px; }
            .title-page p { margin: 2px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #999; padding: 4px; vertical-align: top; }
            th { background: #eee; }
            h2.year-header { background: #ddd; padding: 4px 8px; margin-top: 20px; }
        </style>';

        $html .= '<div class="title-page">
            <h1>RESEARCH MATRIX REPORT</h1>
            <p>University of Southeastern Philippines - MCIIS Research Repository</p>
            <p>Generated on: ' . $generatedOn . '</p>
            <p>Total Research Papers: ' . $totalCount . '</p>
        </div><pagebreak />';

        foreach ($grouped as $year => $records) {
            $html .= '<h2 class="year-header">Year: ' . $year . '</h2>';
            $html .= '<table>
                <thead><tr>
                    <th>ID</th><th>Title</th><th>Adviser</th><th>Researchers</th>
                    <th>Program</th><th>Keywords</th><th>Date Completed</th>
                    <th>Agendas</th><th>SDGs</th><th>SRIGs</th><th>Panel</th><th>Status</th>
                </tr></thead><tbody>';

            foreach ($records as $r) {
                $html .= '<tr>
                    <td>' . $r->id . '</td>
                    <td>' . e($r->research_title) . '</td>
                    <td>' . e($this->formatPeople(collect([$r->adviser]))) . '</td>
                    <td>' . e($this->formatPeople($r->researchers)) . '</td>
                    <td>' . e($r->program->name ?? 'N/A') . '</td>
                    <td>' . e($this->formatTagList($r->keywords, 'keyword_name')) . '</td>
                    <td>' . e($this->formatMonthYear($r->published_month, $r->published_year)) . '</td>
                    <td>' . e($this->formatTagList($r->agendas)) . '</td>
                    <td>' . e($this->formatTagList($r->sdgs)) . '</td>
                    <td>' . e($this->formatTagList($r->srigs)) . '</td>
                    <td>' . e($this->formatPeople($r->panelists)) . '</td>
                    <td>' . e($r->status ?? 'N/A') . '</td>
                </tr>';
            }
            $html .= '</tbody></table>';
        }

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4-L',
            'margin_top' => 15,
            'margin_bottom' => 15,
        ]);
        $mpdf->WriteHTML($html);

        $filename = 'matrix-report-' . now()->format('Ymd-His') . '.pdf';
        return response($mpdf->Output($filename, \Mpdf\Output\Destination::STRING_RETURN), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }

    // -------------------------------------------------------------------
    // Matrix - DOCX
    // -------------------------------------------------------------------

    private function generateMatrixDocx($grouped, int $totalCount)
    {
        ini_set('memory_limit', '2048M');
        set_time_limit(120);
        gc_collect_cycles();

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(9);

        $section = $phpWord->addSection([
            'orientation' => 'landscape',
            'marginLeft' => 600,
            'marginRight' => 600,
        ]);

        $titleStyle = ['bold' => true, 'size' => 18];
        $subStyle = ['size' => 11];
        $centerPara = ['alignment' => Jc::CENTER];

        $generatedOn = now()->format('F j, Y h:i A');

        $section->addText('RESEARCH MATRIX REPORT', $titleStyle, $centerPara);
        $section->addText('University of Southeastern Philippines - MCIIS Research Repository', $subStyle, $centerPara);
        $section->addText('Generated on: ' . $generatedOn, $subStyle, $centerPara);
        $section->addText('Total Research Papers: ' . $totalCount, $subStyle, $centerPara);
        $section->addPageBreak();

        $tableStyle = ['borderSize' => 6, 'borderColor' => '999999', 'cellMargin' => 80];
        $headerCellStyle = ['bgColor' => 'EEEEEE'];
        $headerFont = ['bold' => true, 'size' => 9];

        $headers = ['ID','Title','Adviser','Researchers','Program','Keywords','Date Completed','Agendas','SDGs','SRIGs','Panel','Status'];

        foreach ($grouped as $year => $records) {
            $section->addText('Year: ' . $this->sanitizeText($year), ['bold' => true, 'size' => 13]);

            $table = $section->addTable($tableStyle);
            $table->addRow();
            foreach ($headers as $h) {
                $table->addCell(1200, $headerCellStyle)->addText($h, $headerFont);
            }

            foreach ($records as $r) {
                $table->addRow();
                $table->addCell(800)->addText((string) $r->id);
                $table->addCell(2400)->addText($this->sanitizeText($r->research_title));
                $table->addCell(1600)->addText($this->sanitizeText($this->formatPeople(collect([$r->adviser]))));
                $table->addCell(1800)->addText($this->sanitizeText($this->formatPeople($r->researchers)));
                $table->addCell(1400)->addText($this->sanitizeText($r->program->name ?? 'N/A'));
                $table->addCell(1600)->addText($this->formatTagList($r->keywords, 'keyword_name')); // already sanitized
                $table->addCell(1200)->addText($this->sanitizeText($this->formatMonthYear($r->published_month, $r->published_year)));
                $table->addCell(1400)->addText($this->formatTagList($r->agendas)); // already sanitized
                $table->addCell(1400)->addText($this->formatTagList($r->sdgs));    // already sanitized
                $table->addCell(1400)->addText($this->formatTagList($r->srigs));   // already sanitized
                $table->addCell(1600)->addText($this->sanitizeText($this->formatPeople($r->panelists)));
                $table->addCell(1000)->addText($this->sanitizeText($r->status ?? 'N/A'));
            }
            $section->addTextBreak(1);
            gc_collect_cycles();
        }

        $filename = 'matrix-report-' . now()->format('Ymd-His') . '.docx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = WordIOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($tempPath);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    // -------------------------------------------------------------------
    // Matrix - Excel
    // -------------------------------------------------------------------

    private function generateMatrixExcel($grouped, int $totalCount)
    {
        
        ini_set('memory_limit', '512M');
        set_time_limit(120);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Matrix Report');

        $generatedOn = now()->format('F j, Y, h:i A');

        $sheet->setCellValue('A1', 'RESEARCH MATRIX REPORT');
        $sheet->setCellValue('A2', 'University of Southeastern Philippines - MCIIS Research Repository');
        $sheet->setCellValue('A3', 'Generated on: ' . $generatedOn);
        $sheet->setCellValue('A4', 'Total Research Papers: ' . $totalCount);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $headers = ['ID','Title','Adviser','Researchers','Program','Keywords','Date Completed','Agendas','SDGs','SRIGs','Panel','Status'];

        $row = 6;
        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}{$row}", $h);
            $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true);
        }
        $row++;

        foreach ($grouped as $year => $records) {
            foreach ($records as $r) {
                $sheet->setCellValue("A{$row}", $r->id);
                $sheet->setCellValue("B{$row}", $r->research_title);
                $sheet->setCellValue("C{$row}", $this->formatPeople(collect([$r->adviser])));
                $sheet->setCellValue("D{$row}", $this->formatPeople($r->researchers));
                $sheet->setCellValue("E{$row}", $r->program->name ?? 'N/A');
                $sheet->setCellValue("F{$row}", $this->formatTagList($r->keywords, 'keyword_name'));
                $sheet->setCellValue("G{$row}", $this->formatMonthYear($r->published_month, $r->published_year));
                $sheet->setCellValue("H{$row}", $this->formatTagList($r->agendas));
                $sheet->setCellValue("I{$row}", $this->formatTagList($r->sdgs));
                $sheet->setCellValue("J{$row}", $this->formatTagList($r->srigs));
                $sheet->setCellValue("K{$row}", $this->formatPeople($r->panelists));
                $sheet->setCellValue("L{$row}", $r->status ?? 'N/A');
                $row++;
            }
        }

        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'matrix-report-' . now()->format('Ymd-His') . '.xlsx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    // -------------------------------------------------------------------
    // Compiled - PDF
    // -------------------------------------------------------------------

    private function generateCompiledPdf($grouped, int $totalCount)
    {
        $generatedOn = now()->format('F j, Y h:i A');

        $html = '<style>
            body { font-family: sans-serif; font-size: 11px; line-height: 1.6; }
            .title-page { text-align: center; margin-top: 300px; page-break-after: always; }
            .title-page h1 { font-size: 28px; margin: 20px 0 10px; }
            .title-page p { margin: 5px 0; font-size: 13px; }
            .program-header { font-size: 16px; font-weight: bold; margin-top: 30px; margin-bottom: 10px; page-break-after: avoid; }
            .research-entry { page-break-inside: avoid; margin-bottom: 40px; padding: 15px; border: 1px solid #ccc; }
            .research-title { font-size: 13px; font-weight: bold; margin-bottom: 8px; }
            .research-meta { font-size: 10px; color: #666; margin-bottom: 8px; }
            .research-abstract { font-size: 11px; line-height: 1.5; text-align: justify; }
        </style>';

        $html .= '<div class="title-page">
            <h1>COMPILED RESEARCH REPORT</h1>
            <p>University of Southeastern Philippines</p>
            <p>MCIIS Research Repository</p>
            <p>Generated on: ' . $generatedOn . '</p>
            <p>Total Research Papers: ' . $totalCount . '</p>
        </div>';

        $programLabels = ['I.', 'II.', 'III.', 'IV.', 'V.'];
        $programIndex = 0;

        foreach ($grouped as $programName => $yearGroups) {
        // Add program header on its own page
        $html .= '<div class="program-page">
            <div style="text-align: center; margin-top: 300px;">
                <h2 style="font-size: 24px; font-weight: bold; margin: 0;">' . $programLabels[$programIndex] . ' ' . htmlspecialchars($programName) . '</h2>
            </div>
        </div>';
        $html .= '<div style="page-break-after: always;"></div>';

        // Research entries
        foreach ($yearGroups as $year => $records) {
            foreach ($records as $r) {
                $html .= '<div class="research-page" style="page-break-after: always;">
                    <div class="research-title">' . e($this->sanitizeText($r->research_title)) . '</div>
                    <div class="research-meta">
                        <strong>Adviser:</strong> ' . e($this->sanitizeText($this->formatPeople(collect([$r->adviser])))) . '<br>
                        <strong>Published:</strong> ' . e($this->formatMonthYear($r->published_month, $r->published_year)) . '<br>
                        <strong>Researchers:</strong> ' . e($this->sanitizeText($this->formatPeople($r->researchers))) . '
                    </div>
                    <div class="research-abstract">
                        <strong>Abstract:</strong><br>
                        ' . nl2br(e($this->sanitizeText($r->research_abstract ?? 'No abstract provided'))) . '
                    </div>
                    <div class="research-meta">
                        <strong>Keywords:</strong> ' . e($this->sanitizeText($this->formatTagList($r->keywords, 'keyword_name'))) . '
                    </div>
                </div>';
            }
        }
        $programIndex++;
    }

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_top' => 15,
            'margin_bottom' => 15,
            'margin_left' => 15,
            'margin_right' => 15,
        ]);
        $mpdf->WriteHTML($html);

        $filename = 'compiled-report-' . now()->format('Ymd-His') . '.pdf';
        return response($mpdf->Output($filename, \Mpdf\Output\Destination::STRING_RETURN), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }

    // -------------------------------------------------------------------
    // Compiled - DOCX
    // -------------------------------------------------------------------

    private function generateCompiledDocx($grouped, int $totalCount)
    {
        ini_set('memory_limit', '2048M');
        set_time_limit(120);

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Calibri');
        $phpWord->setDefaultFontSize(11);

        $section = $phpWord->addSection([
            'marginLeft' => 600,
            'marginRight' => 600,
        ]);

        $titleStyle = ['bold' => true, 'size' => 22];
        $subStyle = ['size' => 12];
        $centerPara = ['alignment' => Jc::CENTER];

        $generatedOn = now()->format('F j, Y h:i A');

        $section->addText('COMPILED RESEARCH REPORT', $titleStyle, $centerPara);
        $section->addText('University of Southeastern Philippines', $subStyle, $centerPara);
        $section->addText('MCIIS Research Repository', $subStyle, $centerPara);
        $section->addText('Generated on: ' . $generatedOn, $subStyle, $centerPara);
        $section->addText('Total Research Papers: ' . $totalCount, $subStyle, $centerPara);
        $section->addPageBreak();

        $programLabels = ['I.', 'II.', 'III.', 'IV.', 'V.'];
        $programIndex = 0;

        foreach ($grouped as $programName => $yearGroups) {
            // Program header on its own page - centered and large
            $section->addText($programLabels[$programIndex] . ' ' . $this->sanitizeText($programName), 
                ['bold' => true, 'size' => 18], 
                ['alignment' => Jc::CENTER]
            );
            $section->addPageBreak();

            // Research entries
            foreach ($yearGroups as $year => $records) {
                foreach ($records as $r) {
                    $section->addText($this->sanitizeText($r->research_title), ['bold' => true, 'size' => 14]);
                    $section->addText('Adviser: ' . $this->sanitizeText($this->formatPeople(collect([$r->adviser]))), ['size' => 11]);
                    $section->addText('Published: ' . $this->sanitizeText($this->formatMonthYear($r->published_month, $r->published_year)), ['size' => 11]);
                    $section->addText('Researchers: ' . $this->sanitizeText($this->formatPeople($r->researchers)), ['size' => 11]);
                    $section->addText('Abstract:', ['bold' => true, 'size' => 11]);
                    $section->addText($this->sanitizeText($r->research_abstract ?? 'No abstract provided'), ['size' => 11]);
                    $section->addText('Keywords: ' . $this->sanitizeText($this->formatTagList($r->keywords, 'keyword_name')), ['size' => 11]);
                    $section->addPageBreak();
                }
            }
            $programIndex++;
        }

        $filename = 'compiled-report-' . now()->format('Ymd-His') . '.docx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = WordIOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($tempPath);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    // -------------------------------------------------------------------
    // Compiled - Excel
    // -------------------------------------------------------------------

    private function generateCompiledExcel($grouped, int $totalCount)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(120);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Compiled Report');

        $generatedOn = now()->format('F j, Y h:i A');

        $sheet->setCellValue('A1', 'COMPILED RESEARCH REPORT');
        $sheet->setCellValue('A2', 'University of Southeastern Philippines');
        $sheet->setCellValue('A3', 'MCIIS Research Repository');
        $sheet->setCellValue('A4', 'Generated on: ' . $generatedOn);
        $sheet->setCellValue('A5', 'Sorted by: Program, then Year (Chronological Order)');
        $sheet->setCellValue('A6', 'Total Research Papers: ' . $totalCount);

        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $headers = ['ID', 'Title', 'Adviser', 'Published', 'Researchers', 'Abstract', 'Keywords'];
        $row = 8;
        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}{$row}", $h);
            $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true);
        }
        $row++;

        foreach ($grouped as $programName => $yearGroups) {
            foreach ($yearGroups as $year => $records) {
                foreach ($records as $r) {
                    $sheet->setCellValue("A{$row}", $r->id);
                    $sheet->setCellValue("B{$row}", $this->sanitizeText($r->research_title));
                    $sheet->setCellValue("C{$row}", $this->sanitizeText($this->formatPeople(collect([$r->adviser]))));
                    $sheet->setCellValue("D{$row}", $this->sanitizeText($this->formatMonthYear($r->published_month, $r->published_year)));
                    $sheet->setCellValue("E{$row}", $this->sanitizeText($this->formatPeople($r->researchers)));
                    $sheet->setCellValue("F{$row}", $this->sanitizeText($r->research_abstract ?? 'No abstract provided'));
                    $sheet->setCellValue("G{$row}", $this->sanitizeText($this->formatTagList($r->keywords, 'keyword_name')));
                    $row++;
                }
            }
        }

        // Update auto-sizing to include column G
        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'compiled-report-' . now()->format('Ymd-His') . '.xlsx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

}