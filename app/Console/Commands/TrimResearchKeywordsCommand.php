<?php
namespace App\Console\Commands;

use App\Models\Research;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TrimResearchKeywordsCommand extends Command
{
    protected $signature = 'research:trim-keywords
        {--dry-run : Preview changes without modifying the database}
        {--backup-dir=backups : Backup directory inside storage/app}';

    protected $description = 'Trim research keywords to at most 5 using title/abstract relevance scoring, with backup and reporting';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $backupDir = trim((string) $this->option('backup-dir')) ?: 'backups';

        $backupPath = $this->backupPivotTable($backupDir);
        $this->info("Backup created: {$backupPath}");

        $researches = Research::with('keywords')->get();

        $trimmedReports = [];
        $unchangedReports = [];

        foreach ($researches as $research) {
            $keywords = $research->keywords;

            if ($keywords->count() <= 5) {
                $unchangedReports[] = [
                    'id' => $research->id,
                    'title' => $this->getTitle($research),
                    'keyword_count' => $keywords->count(),
                    'keywords' => $keywords->pluck('keyword_name')->values()->all(),
                ];

                continue;
            }

            $selectedKeywords = $this->selectMostRelevantKeywords($research, $keywords);
            $selectedIds = $selectedKeywords->pluck('id')->all();

            $before = $keywords->pluck('keyword_name')->values()->all();
            $after = $selectedKeywords->pluck('keyword_name')->values()->all();

            $detachIds = $keywords->pluck('id')
                ->reject(fn ($id) => in_array($id, $selectedIds, true))
                ->values()
                ->all();

            if (! empty($detachIds)) {
                if (! $dryRun) {
                    $research->keywords()->detach($detachIds);
                }

                $trimmedReports[] = [
                    'id' => $research->id,
                    'title' => $this->getTitle($research),
                    'before' => $before,
                    'after' => $after,
                    'detached' => $keywords->whereIn('id', $detachIds)->pluck('keyword_name')->values()->all(),
                ];
            } else {
                $unchangedReports[] = [
                    'id' => $research->id,
                    'title' => $this->getTitle($research),
                    'keyword_count' => $keywords->count(),
                    'keywords' => $before,
                ];
            }
        }

        $this->info('');
        $this->info('Summary');
        $this->info('-------');
        $this->info('Trimmed records: ' . count($trimmedReports));
        $this->info('Left unchanged (already <= 5): ' . count($unchangedReports));

        if (! empty($trimmedReports)) {
            $this->info('');
            $this->info('Trimmed records (before/after):');

            foreach ($trimmedReports as $report) {
                $this->info('');
                $this->info("ID {$report['id']} - {$report['title']}");
                $this->info('Before: ' . implode(', ', $report['before']));
                $this->info('After:  ' . implode(', ', $report['after']));
                $this->info('Detached: ' . implode(', ', $report['detached']));
            }
        }

        if (! empty($unchangedReports)) {
            $this->info('');
            $this->info('Unchanged records (<= 5 keywords):');

            foreach ($unchangedReports as $report) {
                $this->info("ID {$report['id']} - {$report['title']} => " . implode(', ', $report['keywords']));
            }
        }

        return 0;
    }

    protected function backupPivotTable(string $backupDir): string
    {
        $rows = DB::table('research_keywords')
            ->select('*')
            ->get()
            ->map(fn ($row) => (array) $row)
            ->values()
            ->all();

        $filename = 'research_keywords_backup_' . Carbon::now()->format('Ymd_His') . '.json';
        $relativePath = rtrim($backupDir, '/') . '/' . $filename;

        Storage::disk('local')->put($relativePath, json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return storage_path('app/' . $relativePath);
    }

    protected function selectMostRelevantKeywords(Research $research, Collection $keywords): Collection
    {
        $title = $this->getTitle($research);
        $abstract = $this->getAbstract($research);
        $documentText = $this->normalize($title . ' ' . $abstract);
        $documentTokens = $this->tokenize($documentText);

        $scored = $keywords->map(function ($keyword, $index) use ($title, $abstract, $documentText, $documentTokens) {
            $keywordName = (string) $keyword->keyword_name;
            $keywordNormalized = $this->normalize($keywordName);
            $keywordTokens = $this->tokenize($keywordNormalized);

            $score = 0;

            if ($keywordNormalized !== '') {
                if (str_contains($this->normalize($title), $keywordNormalized)) {
                    $score += 80;
                }

                if (str_contains($this->normalize($abstract), $keywordNormalized)) {
                    $score += 40;
                }

                if (str_contains($documentText, $keywordNormalized)) {
                    $score += 60;
                }

                $overlap = count(array_intersect($keywordTokens, $documentTokens));
                $score += $overlap * 12;

                $score += $this->countSubtokenMatches($keywordTokens, $documentTokens) * 4;
            }

            return [
                'id' => $keyword->id,
                'keyword_name' => $keywordName,
                'score' => $score,
                'index' => $index,
            ];
        });

        $scoredArray = $scored->values()->all();

        usort($scoredArray, function ($a, $b) {
            return ($b['score'] <=> $a['score']) ?: ($a['index'] <=> $b['index']);
        });

        $ordered = collect($scoredArray);

        return collect($ordered->take(5)->map(function ($item) use ($keywords) {
            return $keywords->firstWhere('id', $item['id']);
        })->filter())->values();
    }

    protected function countSubtokenMatches(array $keywordTokens, array $documentTokens): int
    {
        $count = 0;

        foreach ($keywordTokens as $token) {
            if (in_array($token, $documentTokens, true)) {
                $count++;
            }
        }

        return $count;
    }

    protected function getTitle(Research $research): string
    {
        return (string) (
            $research->getAttribute('research_title')
            ?? $research->getAttribute('title')
            ?? ''
        );
    }

    protected function getAbstract(Research $research): string
    {
        return (string) (
            $research->getAttribute('abstract')
            ?? $research->getAttribute('research_abstract')
            ?? ''
        );
    }

    protected function normalize(string $value): string
    {
        $value = mb_strtolower($value);
        $value = preg_replace('/[^a-z0-9]+/u', ' ', $value);
        $value = preg_replace('/\s+/', ' ', $value);

        return trim((string) $value);
    }

    protected function tokenize(string $value): array
    {
        $normalized = $this->normalize($value);

        if ($normalized === '') {
            return [];
        }

        return array_values(array_unique(preg_split('/\s+/', $normalized) ?: []));
    }
}