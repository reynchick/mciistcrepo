<?php

namespace App\Services\Reports;

use App\Models\Agenda;
use App\Models\Program;
use App\Models\Research;
use App\Models\SDG;
use App\Models\SRIG;
use App\Models\Faculty;
use Mpdf\Mpdf;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\SimpleType\Jc;

class ResearchAlignmentReportService extends AbstractReportService
{
    public function export(string $format, array $filters, bool $isPreview = false)
    {
        if (!in_array($format, ['pdf', 'docx'], true)) {
            return response()->json(['error' => 'Invalid format. Allowed formats are PDF and DOCX.'], 422);
        }

        $data = $this->reportData($filters);

        return match ($format) {
            'pdf' => $this->generatePdf($data, $filters, $isPreview),
            'docx' => $this->generateDocx($data, $filters),
        };
    }

    /** The shared result used by the on-screen breakdown and every export. */
    public function breakdownData(array $filters): array
    {
        [$model, $relation, $categoryLabel] = $this->alignmentCategory($filters['category']);
        $query = $this->researchQuery($filters);
        $matchingPapers = (clone $query)->count('researches.id');
        $selectedIds = $filters['items'];
        $entries = $model::query()->orderBy('name')->get()
            ->filter(fn ($entry) => $selectedIds === [] || in_array((int) $entry->id, $selectedIds, true));
        $items = [];

        foreach ($entries as $entry) {
            [$code, $name] = $this->splitAlignmentName($entry->name, $categoryLabel);
            $count = (clone $query)
                ->whereHas($relation, fn ($alignment) => $alignment->where($relation.'.id', $entry->id))
                ->count('researches.id');
            $items[] = [
                'id' => $entry->id,
                'code' => $code,
                'name' => $name,
                'matchingPapers' => $count,
                'share' => $matchingPapers === 0 ? 0 : round(($count / $matchingPapers) * 100, 1),
            ];
        }

        // Match the screen's ordering: paper count descending, then original name order.
        $items = array_values(collect($items)->sortByDesc('matchingPapers')->all());

        return [
            'category' => $categoryLabel,
            'matchingPapers' => $matchingPapers,
            'itemsShown' => count($items),
            'itemsWithPapers' => count(array_filter($items, static fn (array $item) => $item['matchingPapers'] > 0)),
            'items' => $items,
        ];
    }

    private function alignmentCategory(string $category): array
    {
        return match ($category) {
            'srig' => [SRIG::class, 'srigs', 'SRIG'],
            'agenda' => [Agenda::class, 'agendas', 'Agenda'],
            default => [SDG::class, 'sdgs', 'SDG'],
        };
    }

    private function reportData(array $filters): array
    {
        [, $relation, $categoryLabel] = $this->alignmentCategory($filters['category']);
        $query = $this->researchQuery($filters);
        $shared = $this->breakdownData($filters);
        $matchingPapers = $shared['matchingPapers'];
        $items = $shared['items'];
        $selectedIds = $filters['items'];
        $papersByItem = [];

        foreach ($items as $item) {
            $papersByItem[$item['id']] = (clone $query)
                ->whereHas($relation, fn ($alignment) => $alignment->where($relation.'.id', $item['id']))
                ->with(['program:id,name', 'adviser:id,first_name,middle_name,last_name'])
                ->orderByDesc('completed_year')
                ->orderBy('research_title')
                ->get(['id', 'research_title', 'program_id', 'research_adviser', 'completed_year', 'status'])
                ->map(fn (Research $research) => [
                    'id' => $research->id,
                    'title' => $research->research_title,
                    'program' => $research->program?->name ?? '—',
                    'adviser' => $this->facultyName($research->adviser),
                    'year' => $research->completed_year ?? '—',
                    'status' => $research->getRawOriginal('status') === 'draft_invited'
                        ? 'Draft (Invited)'
                        : $research->status->label(),
                ])->all();
        }

        $selectedLabels = array_map(static fn (array $item) => trim($item['code'].' '.$item['name']), $items);
        $filters['category_label'] = $categoryLabel;
        $filters['year_label'] = $filters['year'] === null ? 'All years' : (string) $filters['year'];
        $filters['program_label'] = $filters['program'] === null ? 'All programs' : (Program::query()->find($filters['program'])?->name ?? 'All programs');
        $filters['adviser_label'] = $filters['adviser'] === null ? 'All advisers' : ($this->facultyName(Faculty::query()->find($filters['adviser'])) ?: 'All advisers');
        $filters['status_label'] = match ($filters['status']) {
            'all' => 'All active statuses',
            'draft' => 'Draft',
            'draft_invited' => 'Draft (Invited)',
            'submitted' => 'Submitted for Review',
            'returned' => 'Returned for Revision',
            default => 'Posted',
        };
        $filters['items_label'] = $selectedIds === [] ? 'All items' : implode(', ', $selectedLabels);

        return [
            'category' => $categoryLabel,
            'matchingPapers' => $matchingPapers,
            'itemsShown' => $shared['itemsShown'],
            'itemsWithPapers' => $shared['itemsWithPapers'],
            'items' => $items,
            'papersByItem' => $papersByItem,
            'filters' => $filters,
            'generatedOn' => now()->format('F j, Y h:i A'),
        ];
    }

    private function researchQuery(array $filters)
    {
        return Research::query()->active()->whereNull('archived_at')
            ->when($filters['year'] !== null, fn ($query) => $query->where('completed_year', $filters['year']))
            ->when($filters['program'] !== null, fn ($query) => $query->where('program_id', $filters['program']))
            ->when($filters['adviser'] !== null, fn ($query) => $query->where('research_adviser', $filters['adviser']))
            ->when($filters['status'] !== 'all', fn ($query) => $query->where('status', $filters['status']));
    }

    private function splitAlignmentName(string $value, string $category): array
    {
        if (str_contains($value, ':')) {
            return array_map('trim', explode(':', $value, 2));
        }

        return [$category, $value];
    }

    private function facultyName(?Faculty $faculty): string
    {
        if ($faculty === null) return '—';

        return trim(implode(' ', array_filter([$faculty->first_name, $faculty->middle_name, $faculty->last_name]))) ?: '—';
    }

    private function generatePdf(array $data, array $filters, bool $isPreview)
    {
        set_time_limit(120);
        ini_set('memory_limit', '512M');
        $html = '<style>body{font-family:sans-serif;font-size:9px;color:#222}h1{font-size:20px}h2{font-size:14px;margin-top:20px}table{width:100%;border-collapse:collapse;margin:8px 0 16px;table-layout:fixed}th,td{border:1px solid #999;padding:5px;vertical-align:top;word-wrap:break-word}th{background:#eee}.note{margin-top:14px;font-style:italic}.total{font-weight:bold;background:#f5f5f5}.breakdown th:nth-child(1){width:16%}.breakdown th:nth-child(2){width:48%}.breakdown th:nth-child(3){width:16%}.breakdown th:nth-child(4){width:20%}</style>';
        $html .= '<h1>Research Alignment Report</h1><p>Category: '.e($data['category']).'</p><p>University of Southeastern Philippines - CIC Knowledge Management System</p>';
        $html .= '<p>Generated on: '.e($data['generatedOn']).'</p><h2>Filters used</h2><table><tbody>';
        foreach ($this->filterRows($data['filters']) as [$label, $value]) $html .= '<tr><th>'.e($label).'</th><td>'.e($value).'</td></tr>';
        $html .= '</tbody></table><h2>Summary</h2><p>Matching research papers: '.$data['matchingPapers'].'<br>Alignment items shown: '.$data['itemsShown'].'<br>Items with at least one matching paper: '.$data['itemsWithPapers'].'</p>';
        $html .= '<h2>Alignment breakdown</h2><table class="breakdown"><thead><tr><th>Item code</th><th>Alignment item</th><th>Papers</th><th>Share of matching papers</th></tr></thead><tbody>';
        foreach ($data['items'] as $item) $html .= '<tr><td>'.e($item['code']).'</td><td>'.e($item['name']).'</td><td>'.$item['matchingPapers'].'</td><td>'.$item['share'].'%</td></tr>';
        $html .= '<tr class="total"><td colspan="2">Total matching papers</td><td style="text-align:right">'.$data['matchingPapers'].'</td><td></td></tr>';
        $html .= '</tbody></table><p class="note">A paper can align with more than one item, so percentages may total more than 100%.</p>';
        $html .= '<h2>Matching research papers</h2>';
        foreach ($data['items'] as $item) {
            $html .= '<h3>'.e($item['code'].' '.$item['name']).'</h3><table><thead><tr><th>Title</th><th>Program</th><th>Adviser</th><th>Year</th><th>Status</th></tr></thead><tbody>';
            foreach ($data['papersByItem'][$item['id']] as $paper) $html .= '<tr><td>'.e($paper['title']).'</td><td>'.e($paper['program']).'</td><td>'.e($paper['adviser']).'</td><td>'.e((string) $paper['year']).'</td><td>'.e($paper['status']).'</td></tr>';
            $html .= '</tbody></table>';
        }

        $mpdf = new Mpdf(['mode' => 'utf-8', 'format' => 'A4-L', 'margin_top' => 15, 'margin_bottom' => 15]);
        $mpdf->WriteHTML($html);
        $filename = 'research-alignment-report-'.now()->format('Ymd-His').'.pdf';
        $path = $this->ensureTempDir().DIRECTORY_SEPARATOR.$filename;
        $mpdf->Output($path, \Mpdf\Output\Destination::FILE);

        if ($isPreview) return response()->file($path, ['Content-Type' => 'application/pdf'])->deleteFileAfterSend(true);

        $this->recordCompiledReport(self::TYPE_MATRIX, self::FORMAT_PDF, $filters, $path, $filename);
        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }

    private function generateDocx(array $data, array $filters)
    {
        $word = new PhpWord();
        $word->setDefaultFontName('Calibri');
        $word->setDefaultFontSize(9);
        $section = $word->addSection(['orientation' => 'landscape']);
        $section->addText('RESEARCH ALIGNMENT REPORT', ['bold' => true, 'size' => 18], ['alignment' => Jc::CENTER]);
        $section->addText('Category: '.$data['category'], [], ['alignment' => Jc::CENTER]);
        $section->addText('University of Southeastern Philippines - CIC Knowledge Management System', [], ['alignment' => Jc::CENTER]);
        $section->addText('Generated on: '.$data['generatedOn'], [], ['alignment' => Jc::CENTER]);
        $section->addTextBreak();
        $section->addText('Filters used', ['bold' => true, 'size' => 13]);
        foreach ($this->filterRows($data['filters']) as [$label, $value]) $section->addText($label.': '.$value);
        $section->addTextBreak();
        $section->addText('Summary', ['bold' => true, 'size' => 13]);
        $section->addText('Matching research papers: '.$data['matchingPapers']);
        $section->addText('Alignment items shown: '.$data['itemsShown']);
        $section->addText('Items with at least one matching paper: '.$data['itemsWithPapers']);
        $section->addTextBreak();
        $this->addWordBreakdown($section, $data['items'], $data['matchingPapers']);
        $section->addText('A paper can align with more than one item, so percentages may total more than 100%.', ['italic' => true]);
        $section->addTextBreak();
        $section->addText('Matching research papers', ['bold' => true, 'size' => 13]);
        foreach ($data['items'] as $item) {
            $section->addText($item['code'].' '.$item['name'], ['bold' => true]);
            $table = $section->addTable(['borderSize' => 6, 'borderColor' => '999999', 'cellMargin' => 80]);
            $this->addWordPaperTable($table, $data['papersByItem'][$item['id']]);
        }
        return $this->saveWord($word, $filters);
    }

    private function addWordBreakdown($section, array $items, int $matchingPapers): void
    {
        $section->addText('Alignment breakdown', ['bold' => true, 'size' => 13]);
        $table = $section->addTable(['borderSize' => 6, 'borderColor' => '999999', 'cellMargin' => 80]);
        $table->addRow(null, ['tblHeader' => true]);
        foreach (['Item code', 'Alignment item', 'Papers', 'Share of matching papers'] as $heading) $table->addCell(2200, ['bgColor' => 'EEEEEE'])->addText($heading, ['bold' => true]);
        foreach ($items as $item) {
            $table->addRow();
            foreach ([$item['code'], $item['name'], (string) $item['matchingPapers'], $item['share'].'%'] as $value) $table->addCell(2200)->addText($value);
        }
        $table->addRow();
        $table->addCell(4400, ['gridSpan' => 2, 'bgColor' => 'F5F5F5'])->addText('Total matching papers', ['bold' => true]);
        $table->addCell(2200, ['bgColor' => 'F5F5F5'])->addText((string) $matchingPapers, ['bold' => true]);
        $table->addCell(2200, ['bgColor' => 'F5F5F5']);
    }

    private function addWordPaperTable($table, array $papers): void
    {
        $table->addRow();
        foreach (['Title', 'Program', 'Adviser', 'Year', 'Status'] as $heading) $table->addCell(2400, ['bgColor' => 'EEEEEE'])->addText($heading, ['bold' => true]);
        foreach ($papers as $paper) {
            $table->addRow();
            foreach (['title', 'program', 'adviser', 'year', 'status'] as $key) $table->addCell(2400)->addText((string) $paper[$key]);
        }
    }

    private function saveWord(PhpWord $word, array $filters)
    {
        $filename = 'research-alignment-report-'.now()->format('Ymd-His').'.docx';
        $path = $this->ensureTempDir().DIRECTORY_SEPARATOR.$filename;
        WordIOFactory::createWriter($word, 'Word2007')->save($path);
        $this->recordCompiledReport(self::TYPE_MATRIX, self::FORMAT_WORD, $filters, $path, $filename);
        return response()->download($path, $filename)->deleteFileAfterSend(true);
    }

    private function filterRows(array $filters): array
    {
        return [
            ['Category', $filters['category_label']],
            ['Completed year', $filters['year_label']],
            ['Program', $filters['program_label']],
            ['Adviser', $filters['adviser_label']],
            ['Research status', $filters['status_label']],
            ['Selected items', $filters['items_label']],
        ];
    }
}
