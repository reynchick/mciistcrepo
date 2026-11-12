<?php

namespace App\Services\Reports;

use App\Models\Research;
use Illuminate\Support\Collection;
use Mpdf\Mpdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;

/**
 * Handles the "Research Matrix" report: records in completed-date order,
 * exportable as PDF, DOCX, or Excel.
 */
class MatrixReportService extends AbstractReportService
{
    private const DEFAULT_COLUMNS = [
        'title', 'abstract', 'completed_year', 'status', 'program',
        'adviser', 'researchers', 'panelists', 'keywords', 'alignment',
    ];

    private const COLUMN_LABELS = [
        'title' => 'Title',
        'abstract' => 'Abstract',
        'completed_year' => 'Completed Year',
        'status' => 'Status',
        'program' => 'Program',
        'adviser' => 'Adviser',
        'researchers' => 'Researchers',
        'panelists' => 'Panelists',
        'keywords' => 'Keywords',
        'alignment' => 'Research Alignment',
    ];
    /**
     * Entry point used by the controller. Filters, groups, and generates
     * the report in the requested format.
     */
    public function export(string $format, array $filters, bool $isPreview = false)
    {
        $grouped = $this->getGroupedData($filters);
        $totalCount = $grouped->flatten()->count();

        return match ($format) {
            'pdf'   => $this->generatePdf($grouped, $totalCount, $filters, $isPreview),
            'docx'  => $this->generateDocx($grouped, $totalCount, $filters),
            'excel' => $this->generateExcel($grouped, $totalCount, $filters),
            default => response()->json(['error' => 'Invalid format'], 422),
        };
    }

    /**
     * Fetch matching Research records and group them by Completed Year.
     */
    protected function getGroupedData(array $filters): Collection
    {
        $query = Research::query()
            ->with(['program', 'adviser', 'researchers', 'sdgs', 'srigs', 'agendas', 'keywords', 'panelists'])
            ->whereNull('archived_at');

        if (!empty($filters['program'])) {
            $query->where('program_id', $filters['program']);
        }
        if (!empty($filters['year'])) {
            $query->where('completed_year', $filters['year']);
        }
        if (!empty($filters['adviser'])) {
            $query->where('research_adviser', $filters['adviser']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['title'])) {
            $query->where('research_title', $filters['title']);
        }
        if (!empty($filters['researcher'])) {
            $query->whereHas('researchers', fn ($relation) => $relation->whereKey($filters['researcher']));
        }
        if (!empty($filters['panelist'])) {
            $query->whereHas('panelists', fn ($relation) => $relation->whereKey($filters['panelist']));
        }
        if (!empty($filters['keyword'])) {
            $query->whereHas('keywords', fn ($relation) => $relation->whereKey($filters['keyword']));
        }
        $alignmentSelections = $this->alignmentSelectionMap($filters['alignment_selections'] ?? []);
        if ($alignmentSelections !== []) {
            $query->where(function ($alignmentQuery) use ($alignmentSelections) {
                $first = true;
                foreach ($alignmentSelections as $relation => $ids) {
                    $method = $first ? 'whereHas' : 'orWhereHas';
                    $alignmentQuery->{$method}($relation, fn ($query) => $query->whereIn('id', $ids));
                    $first = false;
                }
            });
        }

        $records = $query
            ->orderBy('completed_year')
            ->orderBy('completed_month')
            ->get();

        return $records->groupBy(function ($r) {
            return $r->completed_year ?? 'Unknown Year';
        })->sortKeys();
    }

    private function columns(array $filters): array
    {
        $requested = $filters['columns'] ?? self::DEFAULT_COLUMNS;
        if (!is_array($requested)) {
            $requested = [];
        }

        return array_values(array_intersect(
            self::DEFAULT_COLUMNS,
            array_unique($requested),
        ));
    }

    private function columnValue($research, string $column, array $filters): string
    {
        return match ($column) {
            'title' => ReportFormatter::sanitizeText($research->research_title),
            'abstract' => ReportFormatter::sanitizeText($research->research_abstract ?? 'N/A'),
            'completed_year' => (string) ($research->completed_year ?? 'N/A'),
            'status' => ReportFormatter::sanitizeText($research->status?->label() ?? 'N/A'),
            'program' => ReportFormatter::sanitizeText($research->program->name ?? 'N/A'),
            'adviser' => ReportFormatter::sanitizeText(ReportFormatter::formatPeople(collect([$research->adviser]))),
            'researchers' => ReportFormatter::sanitizeText(ReportFormatter::formatPeople($research->researchers)),
            'panelists' => ReportFormatter::sanitizeText(ReportFormatter::formatPeople($research->panelists)),
            'keywords' => ReportFormatter::sanitizeText(ReportFormatter::formatTagList($research->keywords, 'keyword_name')),
            'alignment' => ReportFormatter::sanitizeText($this->formatAlignment(
                $research,
                $filters['alignment_selections'] ?? [],
            )),
            default => 'N/A',
        };
    }

    private function formatAlignment($research, array $alignmentSelections = []): string
    {
        $groups = [
            'agenda' => ['Agendas', $research->agendas],
            'sdg' => ['SDGs', $research->sdgs],
            'srig' => ['SRIGs', $research->srigs],
        ];
        $selected = $this->alignmentSelectionMap($alignmentSelections);

        return collect($groups)
            ->filter(function (array $group, string $category) use ($selected) {
                return $selected === [] || isset($selected[$this->alignmentRelation($category)]);
            })
            ->map(function (array $group, string $category) use ($selected) {
                $items = $group[1];
                $relation = $this->alignmentRelation($category);
                if (isset($selected[$relation])) {
                    $items = $items->whereIn('id', $selected[$relation]);
                }
                return $group[0] . ': ' . ReportFormatter::formatTagList($items);
            })
            ->implode('; ');
    }

    private function alignmentSelectionMap(array $selections): array
    {
        $relations = ['sdg' => 'sdgs', 'srig' => 'srigs', 'agenda' => 'agendas'];
        $mapped = [];

        foreach ($selections as $selection) {
            [$category, $id] = explode(':', (string) $selection, 2) + [null, null];
            if (isset($relations[$category]) && ctype_digit((string) $id)) {
                $mapped[$relations[$category]][] = (int) $id;
            }
        }

        return array_map(static fn (array $ids) => array_values(array_unique($ids)), $mapped);
    }

    private function alignmentRelation(string $category): string
    {
        return match ($category) {
            'sdg' => 'sdgs',
            'srig' => 'srigs',
            'agenda' => 'agendas',
        };
    }

    // -------------------------------------------------------------------
    // PDF
    // -------------------------------------------------------------------

    private function generatePdf(Collection $grouped, int $totalCount, array $filters, bool $isPreview)
    {
        set_time_limit(120);
        ini_set('memory_limit', '512M');
        $generatedOn = now()->format('F j, Y h:i A');
        $columns = $this->columns($filters);

        $html = '<style>
            body { font-family: sans-serif; font-size: 9px; }
            .title-page {
                text-align: center;
                margin-top: 300px;
                margin-bottom: 300px;
            }
            .title-page h1 { font-size: 28px; margin: 20px 0 10px; font-weight: bold; }
            .title-page p { margin: 10px 0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #999; padding: 4px; vertical-align: top; }
            th { background: #eee; }
        </style>';

        $html .= '<div style="height: 5px;"></div>
        <div class="title-page">
            <h1>RESEARCH MATRIX REPORT</h1>
            <p>University of Southeastern Philippines - CIC Knowledge Management System</p>
            <p>Generated on: ' . $generatedOn . '</p>
            <p>Total Research Papers: ' . $totalCount . '</p>
        </div>';
        $html .= '<pagebreak />';

        $html .= '<table><thead><tr>';
        foreach ($columns as $column) {
            $html .= '<th>' . e(self::COLUMN_LABELS[$column]) . '</th>';
        }
        $html .= '</tr></thead><tbody>';

        foreach ($grouped->flatten(1) as $r) {
            $html .= '<tr>';
            foreach ($columns as $column) {
                $html .= '<td>' . e($this->columnValue($r, $column, $filters)) . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4-L',
            'margin_top' => 15,
            'margin_bottom' => 15,
        ]);
        $mpdf->WriteHTML($html);

        $filename = 'matrix-report-' . now()->format('Ymd-His') . '.pdf';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($tempPath, \Mpdf\Output\Destination::FILE);

        // Safety net: strip any truly-blank pages that slip through
        $this->stripBlankPages($tempPath);

        if ($isPreview) {
            return response()->file($tempPath, [
                'Content-Type' => 'application/pdf',
            ])->deleteFileAfterSend(true);
        }

        $this->recordCompiledReport(self::TYPE_MATRIX, self::FORMAT_PDF, $filters, $tempPath, $filename);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    // -------------------------------------------------------------------
    // DOCX
    // -------------------------------------------------------------------

    private function generateDocx(Collection $grouped, int $totalCount, array $filters)
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

        for ($i = 0; $i < 6; $i++) {
            $section->addTextBreak();
        }

        $section->addText('RESEARCH MATRIX REPORT', $titleStyle, $centerPara);
        $section->addText('University of Southeastern Philippines - CIC Knowledge Management System', $subStyle, $centerPara);
        $section->addText('Generated on: ' . $generatedOn, $subStyle, $centerPara);
        $section->addText('Total Research Papers: ' . $totalCount, $subStyle, $centerPara);

        for ($i = 0; $i < 6; $i++) {
            $section->addTextBreak();
        }

        $section->addPageBreak();

        $tableStyle = ['borderSize' => 6, 'borderColor' => '999999', 'cellMargin' => 80];
        $headerCellStyle = ['bgColor' => 'EEEEEE'];
        $headerFont = ['bold' => true, 'size' => 9];
        $columns = $this->columns($filters);

        $table = $section->addTable($tableStyle);
        $table->addRow();
        foreach ($columns as $column) {
            $table->addCell(1400, $headerCellStyle)->addText(self::COLUMN_LABELS[$column], $headerFont);
        }

        foreach ($grouped->flatten(1) as $r) {
            $table->addRow();
            foreach ($columns as $column) {
                $table->addCell(1400)->addText($this->columnValue($r, $column, $filters));
            }
        }
        gc_collect_cycles();

        $filename = 'matrix-report-' . now()->format('Ymd-His') . '.docx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = WordIOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($tempPath);

        $this->recordCompiledReport(self::TYPE_MATRIX, self::FORMAT_WORD, $filters, $tempPath, $filename);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    // -------------------------------------------------------------------
    // Excel
    // -------------------------------------------------------------------

    private function generateExcel(Collection $grouped, int $totalCount, array $filters)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(120);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Matrix Report');

        $generatedOn = now()->format('F j, Y, h:i A');

        $sheet->setCellValue('A1', 'RESEARCH MATRIX REPORT');
        $sheet->setCellValue('A2', 'University of Southeastern Philippines - CIC Knowledge Management System');
        $sheet->setCellValue('A3', 'Generated on: ' . $generatedOn);
        $sheet->setCellValue('A4', 'Total Research Papers: ' . $totalCount);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $columns = $this->columns($filters);

        $row = 6;
        foreach ($columns as $i => $column) {
            $col = Coordinate::stringFromColumnIndex($i + 1);
            $sheet->setCellValue("{$col}{$row}", self::COLUMN_LABELS[$column]);
            $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true);
        }
        $row++;

        foreach ($grouped as $year => $records) {
            foreach ($records as $r) {
                foreach ($columns as $i => $column) {
                    $col = Coordinate::stringFromColumnIndex($i + 1);
                    $sheet->setCellValue("{$col}{$row}", $this->columnValue($r, $column, $filters));
                }
                $row++;
            }
        }

        foreach (range(1, count($columns)) as $columnIndex) {
            $col = Coordinate::stringFromColumnIndex($columnIndex);
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'matrix-report-' . now()->format('Ymd-His') . '.xlsx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        $this->recordCompiledReport(self::TYPE_MATRIX, self::FORMAT_EXCEL, $filters, $tempPath, $filename);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }
}