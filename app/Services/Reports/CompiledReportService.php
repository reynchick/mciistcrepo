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
 * Handles the "Compiled Report" (Book of Abstracts): records grouped by
 * program, then by year within each program, one page per research entry.
 * Exportable as PDF or DOCX. Excel generation exists (generateExcel) but is
 * intentionally not wired into export() — mirrors the frontend, where the
 * Excel export option is commented out on the Compiled card. Both are kept
 * in sync deliberately; uncomment together if Excel support is needed later.
 */
class CompiledReportService extends AbstractReportService
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
            // 'excel' => $this->generateExcel($grouped, $totalCount, $filters),
            default => response()->json(['error' => 'Invalid format'], 422),
        };
    }

    /**
     * Fetch matching Research records, grouped by program, then by
     * published year within each program.
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

        // Group by program, then by year within program
        return $records->groupBy(function ($r) {
            return $r->program->name ?? 'Uncategorized';
        })->map(function ($programGroup) {
            return $programGroup->groupBy(function ($r) {
                return $r->published_year ?? 'Unknown Year';
            })->sortKeys();
        });
    }

    // -------------------------------------------------------------------
    // PDF
    // -------------------------------------------------------------------

    private function generatePdf(Collection $grouped, int $totalCount, array $filters, bool $isPreview)
    {
        set_time_limit(120);
        ini_set('memory_limit', '512M');
        $generatedOn = now()->format('F j, Y h:i A');

        $style = '<style>
            body { font-family: sans-serif; font-size: 11px; line-height: 1.6; }
            .page-header { display: table; width: 100%; margin-bottom: 40px; table-layout: fixed; }
            .page-header-text { display: table-cell; vertical-align: top; width: 70%; font-size: 50px; font-weight: bold; color: #023047; text-transform: uppercase; line-height: 1.3; }
            .page-header-logo { display: table-cell; vertical-align: top; text-align: right; width: 30%; }
            .page-header-logo img { width: 70px; height: auto; }
            .title-page { text-align: center; margin-top: 200px; page-break-after: always; }
            .title-page h1 { font-size: 30px; margin: 20px 0 10px; }
            .title-page p { margin: 5px 0; font-size: 13px; }
            .program-header { font-size: 20px; font-weight: bold; margin-top: 30px; margin-bottom: 10px; page-break-after: avoid; }
            .research-page { padding: 40px; page-break-inside: avoid; }
            .research-title { font-size: 20px; font-weight: bold; color: #023047; text-align: center; margin-bottom: 30px; }
            .research-researchers { text-align: center; margin-bottom: 20px; font-size: 15px; line-height: 1.5; }
            .research-adviser { text-align: center; margin-bottom: 30px; font-size: 15px; }
            .research-date { text-align: center; margin-bottom: 30px; font-size: 15px; }
            .research-abstract { text-align: justify; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
            .abstract-title { display: block; text-align: center; font-weight: bold; margin-bottom: 10px; }
            .research-keywords { text-align: justify; font-size: 15px; font-style: italic; }
        </style>';

        // ---- PAGE 1: Title page (no watermark) ----
        $titleHtml = $style;
        $titleHtml .= '<table class="page-header" style="width:100%; table-layout:fixed; margin-top: 10px;">
        <tr>
            <td style="width:70%; vertical-align:top; padding-top: 15px;">
                <span style="font-size:22px; font-weight:bold; color:#023047; text-transform:uppercase; line-height:1.4;">
                    COLLEGE OF INFORMATION<br>AND COMPUTING
                </span>
            </td>
            <td style="width:30%; vertical-align:top; text-align:right;">
                <img src="' . public_path('cic-logo.jpg') . '" style="width:70px; height:auto;">
            </td>
        </tr>
    </table>';
        $titleHtml .= '<div class="title-page">
            <h1>BOOK OF ABSTRACTS</h1>
            <p>University of Southeastern Philippines</p>
            <p>MCIIS Research Repository</p>
            <p>Generated on: ' . $generatedOn . '</p>
            <p>Total Research Papers: ' . $totalCount . '</p>
        </div>';

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'margin_top' => 15,
            'margin_bottom' => 15,
            'margin_left' => 15,
            'margin_right' => 15,
        ]);

        $mpdf->WriteHTML($titleHtml);
        $mpdf->SetWatermarkText('For USeP-CIC Use Only', 0.1);
        $mpdf->showWatermarkText = true;

        // ---- PAGES 2+: Programs and research entries (watermarked) ----
        $programLabels = ['I.', 'II.', 'III.', 'IV.', 'V.'];
        $programIndex = 0;

        $totalPrograms = $grouped->count();
        $totalBlocks = $totalPrograms + $totalCount; // every program header + every research entry is one "block"
        $blockIndex = 0;

        foreach ($grouped as $programName => $yearGroups) {
            $blockIndex++;

            $programHtml = '<div class="program-page">
                <div style="text-align: center; padding-top: 300px;">
                    <h2 style="font-size: 24px; font-weight: bold; margin: 0;">' . $programLabels[$programIndex] . ' ' . htmlspecialchars($programName) . '</h2>
                </div>
            </div>';

            $mpdf->WriteHTML($programHtml);

            if ($blockIndex < $totalBlocks) {
                $mpdf->WriteHTML('<pagebreak />');
            }

            foreach ($yearGroups as $year => $records) {
                foreach ($records as $r) {
                    $blockIndex++;

                    $researchHtml = '<div class="research-page">
                        <div class="research-title">' . e(ReportFormatter::sanitizeText($r->research_title)) . '</div>
                        <div class="research-researchers">
                            ' . str_replace(', ', '<br>', e(ReportFormatter::sanitizeText(ReportFormatter::formatPeople($r->researchers)))) . '
                        </div>
                        <div class="research-adviser">
                            ' . e(ReportFormatter::sanitizeText(ReportFormatter::formatPeople(collect([$r->adviser])))) . '
                        </div>
                        <div class="research-date">
                            ' . e(ReportFormatter::formatMonthYear($r->published_month, $r->published_year)) . '
                        </div>
                        <div class="research-abstract">
                            <div class="abstract-title">Abstract</div>
                            ' . nl2br(e(ReportFormatter::sanitizeText($r->research_abstract ?? 'No abstract provided'))) . '
                        </div>';

                    $keywords = ReportFormatter::formatTagList($r->keywords, 'keyword_name');
                    if ($keywords && $keywords !== 'N/A') {
                        $researchHtml .= '<div class="research-keywords">
                            <strong>Keywords:</strong> ' . e(ReportFormatter::sanitizeText($keywords)) . '
                        </div>';
                    }

                    $researchHtml .= '</div>';

                    $mpdf->WriteHTML($researchHtml);

                    if ($blockIndex < $totalBlocks) {
                        $mpdf->WriteHTML('<pagebreak />');
                    }
                }
            }
            $programIndex++;
        }

        $filename = 'compiled-report-' . now()->format('Ymd-His') . '.pdf';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;
        $mpdf->Output($tempPath, \Mpdf\Output\Destination::FILE);

        // Safety net: strip any truly-blank pages that slip through despite the above
        $this->stripBlankPages($tempPath);

        if ($isPreview) {
            return response()->file($tempPath, [
                'Content-Type' => 'application/pdf',
            ])->deleteFileAfterSend(true);
        }

        $this->recordCompiledReport(self::TYPE_COMPILED, self::FORMAT_PDF, $filters, $tempPath, $filename);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    // -------------------------------------------------------------------
    // DOCX
    // -------------------------------------------------------------------

    private function generateDocx(Collection $grouped, int $totalCount, array $filters)
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

        $totalPrograms = $grouped->count();
        $totalBlocks = $totalPrograms + $totalCount;
        $blockIndex = 0;

        foreach ($grouped as $programName => $yearGroups) {
            $blockIndex++;

            $section->addText($programLabels[$programIndex] . ' ' . ReportFormatter::sanitizeText($programName),
                ['bold' => true, 'size' => 18],
                ['alignment' => Jc::CENTER]
            );
            if ($blockIndex < $totalBlocks) {
                $section->addPageBreak();
            }

            foreach ($yearGroups as $year => $records) {
                foreach ($records as $r) {
                    $blockIndex++;
                    $section->addText(ReportFormatter::sanitizeText($r->research_title), ['bold' => true, 'size' => 14]);
                    $section->addText('Adviser: ' . ReportFormatter::sanitizeText(ReportFormatter::formatPeople(collect([$r->adviser]))), ['size' => 11]);
                    $section->addText('Published: ' . ReportFormatter::sanitizeText(ReportFormatter::formatMonthYear($r->published_month, $r->published_year)), ['size' => 11]);
                    $section->addText('Researchers: ' . ReportFormatter::sanitizeText(ReportFormatter::formatPeople($r->researchers)), ['size' => 11]);
                    $section->addText('Abstract:', ['bold' => true, 'size' => 11]);
                    $section->addText(ReportFormatter::sanitizeText($r->research_abstract ?? 'No abstract provided'), ['size' => 11]);
                    $section->addText('Keywords: ' . ReportFormatter::sanitizeText(ReportFormatter::formatTagList($r->keywords, 'keyword_name')), ['size' => 11]);
                    if ($blockIndex < $totalBlocks) {
                        $section->addPageBreak();
                    }
                }
            }
            $programIndex++;
        }

        $filename = 'compiled-report-' . now()->format('Ymd-His') . '.docx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = WordIOFactory::createWriter($phpWord, 'Word2007');
        $writer->save($tempPath);

        $this->recordCompiledReport(self::TYPE_COMPILED, self::FORMAT_WORD, $filters, $tempPath, $filename);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    // -------------------------------------------------------------------
    // Excel (not currently wired into export() — see class docblock)
    // -------------------------------------------------------------------

    private function generateExcel(Collection $grouped, int $totalCount, array $filters)
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
                    $sheet->setCellValue("B{$row}", ReportFormatter::sanitizeText($r->research_title));
                    $sheet->setCellValue("C{$row}", ReportFormatter::sanitizeText(ReportFormatter::formatPeople(collect([$r->adviser]))));
                    $sheet->setCellValue("D{$row}", ReportFormatter::sanitizeText(ReportFormatter::formatMonthYear($r->published_month, $r->published_year)));
                    $sheet->setCellValue("E{$row}", ReportFormatter::sanitizeText(ReportFormatter::formatPeople($r->researchers)));
                    $sheet->setCellValue("F{$row}", ReportFormatter::sanitizeText($r->research_abstract ?? 'No abstract provided'));
                    $sheet->setCellValue("G{$row}", ReportFormatter::sanitizeText(ReportFormatter::formatTagList($r->keywords, 'keyword_name')));
                    $row++;
                }
            }
        }

        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'compiled-report-' . now()->format('Ymd-His') . '.xlsx';
        $tempPath = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename;

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        $this->recordCompiledReport(self::TYPE_COMPILED, self::FORMAT_EXCEL, $filters, $tempPath, $filename);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }
}