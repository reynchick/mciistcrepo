<?php

namespace App\Services\Reports;

use App\Models\CompiledReport;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use PhpOffice\PhpWord\Element\Section;
use Smalot\PdfParser\Parser as PdfTextParser;
use ZipArchive;

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

    protected const TYPE_MATRIX = 2; // Tabular Report

    protected const FORMAT_PDF = 1;

    protected const FORMAT_WORD = 2;

    protected const FORMAT_EXCEL = 3;

    protected const WATERMARK_TEXT = 'For USeP-CIC Use Only';

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

        $relativePath = 'reports/'.$filename;

        Storage::disk('private')->put($relativePath, file_get_contents($absoluteFilePath));

        CompiledReport::create([
            'report_type_id' => $reportTypeId,
            'report_format_id' => $reportFormatId,
            'generated_by' => Auth::id(),
            'generated_on' => now(),
            'filters_applied' => $filters,
            'file_path' => $relativePath,
        ]);

        return $relativePath;

    }

    /**
     * Ensure the temp directory used for generated report files exists.
     */
    protected function ensureTempDir(): string
    {

        $dir = storage_path('app/temp');

        if (! file_exists($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;

    }

    /**
     * Attach a header to a DOCX content section so the printed watermark
     * can be injected after save. Call this on content sections only so
     * the title page stays unmarked.
     */
    protected function addDocxTextWatermarkHeader(Section $section): void
    {
        $section->addHeader()->addText('');
    }

    /**
     * Replace PHPWord header parts with Word's native VML printed watermark
     * so the mark is real text (not an image) at the same ~10% opacity as PDF.
     */
    protected function injectDocxTextWatermark(string $docxPath): void
    {
        $zip = new ZipArchive;
        if ($zip->open($docxPath) !== true) {
            return;
        }

        $entries = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (! is_string($name) || str_ends_with($name, '/')) {
                continue;
            }

            $entries[$name] = $zip->getFromIndex($i);
        }
        $zip->close();

        $markup = $this->docxTextWatermarkMarkup();
        $replaced = false;

        foreach ($entries as $name => $contents) {
            $normalized = str_replace('\\', '/', $name);
            if (preg_match('#^word/header\d+\.xml$#', $normalized) !== 1) {
                continue;
            }

            $entries[$name] = $markup;
            $replaced = true;
        }

        if (! $replaced) {
            return;
        }

        foreach ($entries as $name => $contents) {
            $normalized = str_replace('\\', '/', $name);
            if ($normalized !== 'word/settings.xml' || ! is_string($contents) || str_contains($contents, 'displayBackgroundShape')) {
                continue;
            }

            $patched = preg_replace(
                '/<w:settings([^>]*)>/',
                '<w:settings$1><w:displayBackgroundShape/>',
                $contents,
                1
            );

            if (is_string($patched)) {
                $entries[$name] = $patched;
            }
        }

        $tempPath = $docxPath.'.injecting';
        $out = new ZipArchive;
        if ($out->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return;
        }

        foreach ($entries as $name => $contents) {
            $out->addFromString($name, is_string($contents) ? $contents : '');
        }
        $out->close();

        copy($tempPath, $docxPath);
        unlink($tempPath);
    }

    /**
     * Strip any truly-blank pages from a generated PDF. This is a safety
     * net for edge cases where mPDF's own page-break logic still leaves
     * an empty page (e.g. a watermark-only page with no content).
     */
    protected function docxTextWatermarkMarkup(): string
    {
        $text = htmlspecialchars(self::WATERMARK_TEXT, ENT_QUOTES | ENT_XML1, 'UTF-8');

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:p>
    <w:pPr>
      <w:pStyle w:val="Header"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:noProof/>
      </w:rPr>
      <w:pict>
        <v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e">
          <v:formulas>
            <v:f eqn="sum #0 0 10800"/>
            <v:f eqn="prod #0 2 1"/>
            <v:f eqn="sum 21600 0 @1"/>
            <v:f eqn="sum 0 0 @2"/>
            <v:f eqn="sum 21600 0 @3"/>
            <v:f eqn="if @0 @3 0"/>
            <v:f eqn="if @0 21600 @1"/>
            <v:f eqn="if @0 0 @2"/>
            <v:f eqn="if @0 @4 21600"/>
            <v:f eqn="mid @5 @6"/>
            <v:f eqn="mid @8 @5"/>
            <v:f eqn="mid @7 @8"/>
            <v:f eqn="mid @6 @7"/>
            <v:f eqn="sum @6 0 @5"/>
          </v:formulas>
          <v:path textpathok="t" o:connecttype="custom" o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" o:connectangles="270,180,90,0"/>
          <v:textpath on="t" fitshape="t"/>
          <v:handles>
            <v:h position="#0,bottomRight" switch="text" range="0,21600"/>
          </v:handles>
          <o:lock v:ext="edit" textlock="t" shapetype="t"/>
        </v:shapetype>
        <v:shape id="PowerPlusWaterMarkObject" o:spid="_x0000_s2050" type="#_x0000_t136" style="position:absolute;margin-left:0;margin-top:0;width:468pt;height:117pt;rotation:315;z-index:-251658752;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin" o:allowincell="f" fillcolor="silver" stroked="f">
          <v:fill opacity=".1"/>
          <v:textpath style="font-family:&quot;Calibri&quot;;font-size:1pt" on="t" fitpath="t" string="{$text}"/>
        </v:shape>
      </w:pict>
    </w:r>
  </w:p>
</w:hdr>
XML;
    }

    protected function stripBlankPages(string $pdfPath, string $watermarkText = self::WATERMARK_TEXT): void
    {

        $parser = new PdfTextParser;
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

        $mpdf->Output($pdfPath, Destination::FILE);
    }
}
