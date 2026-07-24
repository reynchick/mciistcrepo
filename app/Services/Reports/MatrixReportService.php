<?php

namespace App\Services\Reports;

use App\Models\Research;
use Illuminate\Support\Collection;
use Mpdf\Mpdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;

/**
 * Handles the "Research Matrix" report: records grouped by year, in a
 * tabular layout, exportable as PDF, DOCX, or Excel.
 */
class MatrixReportService extends AbstractReportService
{
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
     * Fetch matching Research records and group them by published year.
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
            $query->where('published_year', $filters['year']);
        }
        if (!empty($filters['adviser'])) {
            $query->where('research_adviser', $filters['adviser']);
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
    // PDF
    // -------------------------------------------------------------------

    private function generatePdf(Collection $grouped, int $totalCount, array $filters, bool $isPreview)
    {
        set_time_limit(120);
        ini_set('memory_limit', '512M');
        $generatedOn = now()->format('F j, Y h:i A');

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
            h2.year-header { background: #ddd; padding: 4px 8px; margin-top: 20px; }
        </style>';

        $html .= '<div style="height: 5px;"></div>
        <div class="title-page">
            <h1>RESEARCH MATRIX REPORT</h1>
            <p>University of Southeastern Philippines - MCIIS Research Repository</p>
            <p>Generated on: ' . $generatedOn . '</p>
            <p>Total Research Papers: ' . $totalCount . '</p>
        </div>';
        $html .= '<pagebreak />';

        $lastYearKey = $grouped->keys()->last();

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
                    <td>' . e(ReportFormatter::formatPeople(collect([$r->adviser]))) . '</td>
                    <td>' . e(ReportFormatter::formatPeople($r->researchers)) . '</td>
                    <td>' . e($r->program->name ?? 'N/A') . '</td>
                    <td>' . e(ReportFormatter::formatTagList($r->keywords, 'keyword_name')) . '</td>
                    <td>' . e(ReportFormatter::formatMonthYear($r->published_month, $r->published_year)) . '</td>
                    <td>' . e(ReportFormatter::formatTagList($r->agendas)) . '</td>
                    <td>' . e(ReportFormatter::formatTagList($r->sdgs)) . '</td>
                    <td>' . e(ReportFormatter::formatTagList($r->srigs)) . '</td>
                    <td>' . e(ReportFormatter::formatPeople($r->panelists)) . '</td>
                    <td>' . e($r->status ?? 'N/A') . '</td>
                </tr>';
            }
            $html .= '</tbody></table>';

            if ($year !== $lastYearKey) {
                $html .= '<pagebreak />';
            }
        }

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
        $section->addText('University of Southeastern Philippines - MCIIS Research Repository', $subStyle, $centerPara);
        $section->addText('Generated on: ' . $generatedOn, $subStyle, $centerPara);
        $section->addText('Total Research Papers: ' . $totalCount, $subStyle, $centerPara);

        for ($i = 0; $i < 6; $i++) {
            $section->addTextBreak();
        }

        $section->addPageBreak();

        $tableStyle = ['borderSize' => 6, 'borderColor' => '999999', 'cellMargin' => 80];
        $headerCellStyle = ['bgColor' => 'EEEEEE'];
        $headerFont = ['bold' => true, 'size' => 9];

        $headers = ['ID', 'Title', 'Adviser', 'Researchers', 'Program', 'Keywords', 'Date Completed', 'Agendas', 'SDGs', 'SRIGs', 'Panel', 'Status'];

        $lastYearKey = $grouped->keys()->last();

        foreach ($grouped as $year => $records) {
            $section->addText('Year: ' . ReportFormatter::sanitizeText($year), ['bold' => true, 'size' => 13]);

            $table = $section->addTable($tableStyle);
            $table->addRow();
            foreach ($headers as $h) {
                $table->addCell(1200, $headerCellStyle)->addText($h, $headerFont);
            }

            foreach ($records as $r) {
                $table->addRow();
                $table->addCell(800)->addText((string) $r->id);
                $table->addCell(2400)->addText(ReportFormatter::sanitizeText($r->research_title));
                $table->addCell(1600)->addText(ReportFormatter::sanitizeText(ReportFormatter::formatPeople(collect([$r->adviser]))));
                $table->addCell(1800)->addText(ReportFormatter::sanitizeText(ReportFormatter::formatPeople($r->researchers)));
                $table->addCell(1400)->addText(ReportFormatter::sanitizeText($r->program->name ?? 'N/A'));
                $table->addCell(1600)->addText(ReportFormatter::formatTagList($r->keywords, 'keyword_name'));
                $table->addCell(1200)->addText(ReportFormatter::sanitizeText(ReportFormatter::formatMonthYear($r->published_month, $r->published_year)));
                $table->addCell(1400)->addText(ReportFormatter::formatTagList($r->agendas));
                $table->addCell(1400)->addText(ReportFormatter::formatTagList($r->sdgs));
                $table->addCell(1400)->addText(ReportFormatter::formatTagList($r->srigs));
                $table->addCell(1600)->addText(ReportFormatter::sanitizeText(ReportFormatter::formatPeople($r->panelists)));
                $table->addCell(1000)->addText(ReportFormatter::sanitizeText($r->status ?? 'N/A'));
            }

            if ($year !== $lastYearKey) {
                $section->addPageBreak();
            }
            gc_collect_cycles();
        }

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
        $sheet->setCellValue('A2', 'University of Southeastern Philippines - MCIIS Research Repository');
        $sheet->setCellValue('A3', 'Generated on: ' . $generatedOn);
        $sheet->setCellValue('A4', 'Total Research Papers: ' . $totalCount);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $headers = ['ID', 'Title', 'Adviser', 'Researchers', 'Program', 'Keywords', 'Date Completed', 'Agendas', 'SDGs', 'SRIGs', 'Panel', 'Status'];

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
                $sheet->setCellValue("C{$row}", ReportFormatter::formatPeople(collect([$r->adviser])));
                $sheet->setCellValue("D{$row}", ReportFormatter::formatPeople($r->researchers));
                $sheet->setCellValue("E{$row}", $r->program->name ?? 'N/A');
                $sheet->setCellValue("F{$row}", ReportFormatter::formatTagList($r->keywords, 'keyword_name'));
                $sheet->setCellValue("G{$row}", ReportFormatter::formatMonthYear($r->published_month, $r->published_year));
                $sheet->setCellValue("H{$row}", ReportFormatter::formatTagList($r->agendas));
                $sheet->setCellValue("I{$row}", ReportFormatter::formatTagList($r->sdgs));
                $sheet->setCellValue("J{$row}", ReportFormatter::formatTagList($r->srigs));
                $sheet->setCellValue("K{$row}", ReportFormatter::formatPeople($r->panelists));
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

        $this->recordCompiledReport(self::TYPE_MATRIX, self::FORMAT_EXCEL, $filters, $tempPath, $filename);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }
}