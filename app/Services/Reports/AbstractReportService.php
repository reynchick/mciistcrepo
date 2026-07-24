<?php

namespace App\Services\Reports;

use App\Models\CompiledReport;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;
use Smalot\PdfParser\Parser as PdfTextParser;

/**
 * Shared infrastructure for report generation: temp file handling,
 * blank-page stripping, and persisting generated reports to storage +
 * the compiled_reports table. MatrixReportService and CompiledReportService
 * both extend this rather than duplicating this logic.
 */
abstract class AbstractReportService
{
    /**
     * IDs match ReportTypeSeeder / ReportFormatSeeder insertion order.
     * These seeders run once on a fresh database and are not re-run
     * afterward (it uses create(), not firstOrCreate(), so re-running
     * would just create duplicate rows — a visible failure, not a silent
     * one). If the seeder array order is ever changed, update these to match
     * before the next fresh seed.
     */

    protected const TYPE_COMPILED = 1; // Abstract/Executive Summary Compilation
    protected const TYPE_MATRIX   = 2; // Tabular Report

    protected const FORMAT_PDF   = 1;
    protected const FORMAT_WORD  = 2;
    protected const FORMAT_EXCEL = 3;


    /**
     * Persist a generated report file to storage and log it in compiled_reports.
     */

    protected function recordCompiledReport(

        int $reportTypeId,
        int $reportFormatId,
        array $filters,
        string $absoluteFilePath,
        string $filename

    ): string {

        $relativePath = 'reports/' . $filename;

        Storage::disk('public')->put($relativePath, file_get_contents($absoluteFilePath));

        CompiledReport::create([
            'report_type_id'   => $reportTypeId,
            'report_format_id' => $reportFormatId,
            'generated_by'     => Auth::id(),
            'generated_on'     => now(),
            'filters_applied'  => $filters,
            'file_path'        => $relativePath,
        ]);

        return $relativePath;

    }


    /**
     * Ensure the temp directory used for generated report files exists.
     */
    protected function ensureTempDir(): string
    {

        $dir = storage_path('app/temp');

        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
        
    }

    /**
     * Strip any truly-blank pages from a generated PDF. This is a safety
     * net for edge cases where mPDF's own page-break logic still leaves
     * an empty page (e.g. a watermark-only page with no content).
     */
    protected function stripBlankPages(string $pdfPath, string $watermarkText = 'For USeP-CIC Use Only'): void
    {
        
        $parser = new PdfTextParser();
        $document = $parser->parseFile($pdfPath);
        $pages = $document->getPages();

        $blankPageNumbers = [];
        foreach ($pages as $index => $page) {
            $text = $page->getText();

            // Strip out the watermark string and all whitespace/newlines
            $clean = str_ireplace($watermarkText, '', $text);
            $clean = preg_replace('/\s+/u', '', $clean);

            if ($clean === '') {
                $blankPageNumbers[] = $index + 1; // pdfparser is 0-indexed, mPDF import is 1-indexed
            }
        }

        if (empty($blankPageNumbers)) {
            return; // nothing to do
        }

        $mpdf = new Mpdf(['mode' => 'utf-8']);
        $pageCount = $mpdf->SetSourceFile($pdfPath);

        $keptAny = false;
        for ($i = 1; $i <= $pageCount; $i++) {
            if (in_array($i, $blankPageNumbers, true)) {
                continue; // skip truly blank pages
            }

            $tplId = $mpdf->ImportPage($i);
            $size = $mpdf->GetTemplateSize($tplId);

            if ($keptAny) {
                $mpdf->AddPage($size['orientation'] === 'L' ? 'L' : 'P');
            }

            $mpdf->UseTemplate($tplId);
            $keptAny = true;
        }

        $mpdf->Output($pdfPath, \Mpdf\Output\Destination::FILE);
    }
}