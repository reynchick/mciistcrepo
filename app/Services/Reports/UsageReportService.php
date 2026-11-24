<?php

namespace App\Services\Reports;

use App\Models\Program;
use App\Models\ResearchAccessLog;
use App\Models\KeywordSearchLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Mpdf\Mpdf;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\PhpWord;

/** Server-side aggregation and file generation for Admin Usage Reports. */
class UsageReportService extends AbstractReportService
{
    public function data(array $filters): array
    {
        return $filters['type'] === 'keywords'
            ? $this->keywordData($filters)
            : $this->accessData($filters);
    }

    public function export(array $filters, string $format, bool $preview = false)
    {
        if (!in_array($format, ['pdf', 'docx'], true)) {
            return response()->json(['message' => 'Unsupported export format. Allowed formats are PDF and DOCX.'], 422);
        }

        $data = $this->data($filters);
        $filename = 'usage-' . $filters['type'] . '-' . now()->format('Ymd-His');
        return match ($format) {
            'pdf' => $this->pdf($data, $filters, $filename, $preview),
            'docx' => $this->docx($data, $filters, $filename),
        };
    }

    private function keywordData(array $filters): array
    {
        $base = KeywordSearchLog::query()
            ->whereNotNull('search_term')
            ->whereRaw('LENGTH(TRIM(search_term)) >= 2');
        $this->applyDateRange($base, $filters['date_range']);
        if ($filters['term'] !== '') {
            $base->whereRaw('LOWER(search_term) LIKE ?', ['%' . mb_strtolower($filters['term']) . '%']);
        }

        $total = (clone $base)->count();
        $uniqueTermsQuery = (clone $base)
            ->selectRaw('LOWER(TRIM(search_term)) AS normalized_term')
            ->distinct();
        $uniqueTerms = DB::query()->fromSub($uniqueTermsQuery, 'usage_terms')->count();
        $grouped = (clone $base)
            ->selectRaw('LOWER(TRIM(search_term)) AS term, COUNT(*) AS searches')
            ->groupByRaw('LOWER(TRIM(search_term))')
            ->orderByDesc('searches')
            ->orderBy('term');
        $rows = $this->limitRows($grouped, $filters['show']);
        $items = $rows->map(fn ($row) => [
            'term' => (string) $row->term,
            'searches' => (int) $row->searches,
            'share' => $total === 0 ? 0 : round(((int) $row->searches / $total) * 100, 1),
        ])->all();

        return [
            'type' => 'keywords',
            'title' => 'Top Searched Keywords',
            'totalRecords' => count($items),
            'summary' => ['totalSearches' => $total, 'uniqueTerms' => $uniqueTerms, 'termsShown' => count($items)],
            'items' => $items,
        ];
    }

    private function accessData(array $filters): array
    {
        $base = ResearchAccessLog::query()
            ->join('researches', 'researches.id', '=', 'research_access_logs.research_id')
            ->leftJoin('programs', 'programs.id', '=', 'researches.program_id')
            ->whereNotNull('research_access_logs.user_id')
            ->where('researches.status', 'posted')
            ->whereNull('researches.archived_at');
        $this->applyDateRange($base, $filters['date_range'], 'research_access_logs.created_at');
        if ($filters['program'] !== null) {
            $base->where('researches.program_id', $filters['program']);
        }

        $totalAccesses = (clone $base)->count('research_access_logs.id');
        $distinctUsers = (clone $base)->distinct()->count('research_access_logs.user_id');
        $grouped = (clone $base)
            ->select([
                'researches.id',
                'researches.research_title as title',
                'programs.name as program',
            ])
            ->selectRaw('COUNT(research_access_logs.id) AS accesses')
            ->selectRaw('COUNT(DISTINCT research_access_logs.user_id) AS viewers')
            ->groupBy('researches.id', 'researches.research_title', 'programs.name')
            ->orderByDesc('accesses')
            ->orderBy('researches.research_title');
        $rows = $this->limitRows($grouped, $filters['show']);
        $items = $rows->map(fn ($row) => [
            'researchId' => (int) $row->id,
            'title' => (string) $row->title,
            'program' => $row->program ?: '—',
            'accesses' => (int) $row->accesses,
            'viewers' => (int) $row->viewers,
        ])->all();

        return [
            'type' => 'access',
            'title' => 'Research Access',
            'totalRecords' => count($items),
            'summary' => ['authenticatedAccesses' => $totalAccesses, 'distinctUsers' => $distinctUsers, 'titlesShown' => count($items)],
            'items' => $items,
        ];
    }

    private function applyDateRange(Builder $query, string $range, string $column = 'created_at'): void
    {
        $start = match ($range) {
            'last_30_days' => now()->subDays(30)->startOfDay(),
            'last_90_days' => now()->subDays(90)->startOfDay(),
            'last_12_months' => now()->subMonths(12)->startOfDay(),
            default => null,
        };
        if ($start) {
            $query->where($column, '>=', $start);
        }
    }

    private function limitRows(Builder $query, string $show)
    {
        if ($show === 'top_5') $query->limit(5);
        if ($show === 'top_10') $query->limit(10);
        return $query->get();
    }

    private function filterLines(array $filters): array
    {
        $range = [
            'last_30_days' => 'Last 30 days',
            'last_90_days' => 'Last 90 days',
            'last_12_months' => 'Last 12 months',
            'all' => 'All available data',
        ][$filters['date_range']];
        $show = ['top_5' => 'Top 5', 'top_10' => 'Top 10', 'all' => 'All'][$filters['show']];
        $lines = ['Date range: ' . $range, 'Show results: ' . $show];
        if ($filters['type'] === 'keywords') {
            $lines[] = 'Search term: ' . ($filters['term'] !== '' ? $filters['term'] : 'All terms');
        } else {
            $lines[] = 'Program: ' . ($filters['program'] ? (Program::find($filters['program'])?->name ?? 'All programs') : 'All programs');
        }
        return $lines;
    }

    private function tableRows(array $data): array
    {
        if ($data['type'] === 'keywords') {
            return array_map(static fn (array $row) => [$row['term'], $row['searches'], $row['share'] . '%'], $data['items']);
        }
        return array_map(static fn (array $row) => [$row['title'], $row['program'], $row['accesses'], $row['viewers']], $data['items']);
    }

    private function headers(array $data): array
    {
        return $data['type'] === 'keywords'
            ? ['Search term', 'Searches', 'Share of searches']
            : ['Research title', 'Program', 'Accesses', 'Distinct signed-in viewers'];
    }

    private function summaryLines(array $data): array
    {
        return $data['type'] === 'keywords'
            ? ['Total searches: ' . $data['summary']['totalSearches'], 'Unique search terms: ' . $data['summary']['uniqueTerms'], 'Terms shown: ' . $data['summary']['termsShown']]
            : ['Authenticated accesses: ' . $data['summary']['authenticatedAccesses'], 'Distinct signed-in users: ' . $data['summary']['distinctUsers'], 'Research titles shown: ' . $data['summary']['titlesShown']];
    }

    private function pdf(array $data, array $filters, string $filename, bool $preview)
    {
        $escape = static fn ($value) => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $html = '<style>body{font-family:sans-serif;font-size:10px}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #999;padding:6px;text-align:left}th{background:#eee}.muted{color:#555}</style>';
        $html .= '<h1>' . $escape($data['title']) . '</h1><p>Generated: ' . $escape(now()->format('F j, Y h:i A')) . '</p>';
        foreach ($this->filterLines($filters) as $line) $html .= '<p>' . $escape($line) . '</p>';
        foreach ($this->summaryLines($data) as $line) $html .= '<p>' . $escape($line) . '</p>';
        if ($data['type'] === 'keywords') $html .= '<p class="muted">Search terms are aggregated; no user-level data is shown.</p>';
        else $html .= '<p class="muted">Signed-in activity only. Guest and anonymous accesses are excluded.</p>';
        $html .= '<table><thead><tr>' . implode('', array_map(fn ($header) => '<th>' . $escape($header) . '</th>', $this->headers($data))) . '</tr></thead><tbody>';
        foreach ($this->tableRows($data) as $row) {
            $html .= '<tr>' . implode('', array_map(fn ($cell) => '<td>' . $escape($cell) . '</td>', $row)) . '</tr>';
        }
        $html .= '</tbody></table>';
        $mpdf = new Mpdf(['mode' => 'utf-8', 'format' => 'A4-L', 'margin_top' => 15, 'margin_bottom' => 15]);
        $mpdf->WriteHTML($html);
        $path = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename . '.pdf';
        $mpdf->Output($path, \Mpdf\Output\Destination::FILE);
        if ($preview) return response()->file($path, ['Content-Type' => 'application/pdf'])->deleteFileAfterSend(true);
        return response()->download($path, $filename . '.pdf')->deleteFileAfterSend(true);
    }

    private function docx(array $data, array $filters, string $filename)
    {
        $word = new PhpWord();
        $section = $word->addSection();
        $section->addTitle($data['title'], 1);
        $section->addText('Generated: ' . now()->format('F j, Y h:i A'));
        foreach ($this->filterLines($filters) as $line) $section->addText($line);
        foreach ($this->summaryLines($data) as $line) $section->addText($line);
        $section->addText($data['type'] === 'keywords' ? 'Search terms are aggregated; no user-level data is shown.' : 'Signed-in activity only. Guest and anonymous accesses are excluded.');
        $table = $section->addTable(['borderSize' => 6, 'borderColor' => '999999', 'cellMargin' => 80]);
        $table->addRow();
        foreach ($this->headers($data) as $header) $table->addCell()->addText($header, ['bold' => true]);
        foreach ($this->tableRows($data) as $row) {
            $table->addRow();
            foreach ($row as $cell) $table->addCell()->addText((string) $cell);
        }
        $path = $this->ensureTempDir() . DIRECTORY_SEPARATOR . $filename . '.docx';
        WordIOFactory::createWriter($word, 'Word2007')->save($path);
        return response()->download($path, $filename . '.docx')->deleteFileAfterSend(true);
    }

}
