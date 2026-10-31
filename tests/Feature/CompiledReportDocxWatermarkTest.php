<?php

use App\Models\CompiledReport;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\ReportFormat;
use App\Models\ReportType;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function seedCompiledReportCatalog(): void
{
    ReportType::create([
        'name' => 'Abstract/Executive Summary Compilation',
        'description' => 'Compilation of research abstracts and executive summaries',
    ]);
    ReportType::create([
        'name' => 'Tabular Report',
        'description' => 'Tabular representation of research data',
    ]);
    ReportFormat::create(['name' => 'PDF', 'description' => 'Portable Document Format']);
    ReportFormat::create(['name' => 'Word', 'description' => 'Microsoft Word Document']);
    ReportFormat::create(['name' => 'Excel', 'description' => 'Microsoft Excel Spreadsheet']);
}

it('watermarks compiled report docx exports after the title page', function () {
    seedCompiledReportCatalog();

    $admin = User::factory()->asAdministrator()->create();
    $program = Program::factory()->create(['name' => 'BS Information Technology']);
    $adviser = Faculty::create([
        'faculty_id' => 'ADV-DOCX-WM-1',
        'first_name' => 'Watermark',
        'last_name' => 'Adviser',
    ]);

    Research::factory()->posted()->create([
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'research_title' => 'Watermarked Compilation Research',
        'research_abstract' => 'Abstract used to verify compiled DOCX output.',
        'completed_year' => 2025,
    ]);

    $response = $this->actingAs($admin)->get('/admin/reports/export-compiled?format=docx');

    $response->assertOk();
    $response->assertDownload();

    $report = CompiledReport::query()->latest('id')->first();
    expect($report)->not->toBeNull();

    $binary = Storage::disk('private')->get($report->file_path);
    expect($binary)->not->toBeEmpty();

    $tempPath = storage_path('app/temp/compiled-watermark-test.docx');
    if (! is_dir(dirname($tempPath))) {
        mkdir(dirname($tempPath), 0755, true);
    }
    file_put_contents($tempPath, $binary);

    $zip = new ZipArchive;
    expect($zip->open($tempPath))->toBeTrue();

    $headers = [];
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = str_replace('\\', '/', (string) $zip->getNameIndex($i));
        if (preg_match('#^word/header\d+\.xml$#', $name) === 1) {
            $headers[$name] = $zip->getFromIndex($i);
        }
    }

    expect($headers)->not->toBeEmpty();
    foreach ($headers as $header) {
        expect($header)->toContain('For USeP-CIC Use Only')
            ->and($header)->toContain('PowerPlusWaterMarkObject')
            ->and($header)->toContain('opacity=".1"');
    }

    $document = $zip->getFromName('word/document.xml');
    expect($document)->not->toBeFalse()
        ->and($document)->toContain('COMPILED RESEARCH REPORT')
        ->and($document)->toContain('Watermarked Compilation Research');

    preg_match_all('/<w:sectPr\b.*?<\/w:sectPr>/s', $document, $sections);
    expect($sections[0])->toHaveCount(2)
        ->and($sections[0][0])->not->toContain('headerReference')
        ->and($sections[0][1])->toContain('headerReference');

    $zip->close();
    @unlink($tempPath);
});
