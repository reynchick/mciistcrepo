<?php

namespace App\Services\Statistics;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\Program;
use Illuminate\Support\Collection;

class ProgramStatisticsService
{
    public function __construct(
        protected AlignmentStatisticsService $alignmentService
    ) {}

    /**
     * Get statistics for a specific program.
     *
     * @param int $programId
     * @param int $startYear
     * @param int $endYear
     * @param Program|null $program
     * @return array
     */
    public function getProgramStatistics(int $programId, int $startYear, int $endYear, ?Program $program = null): array
    {
        $program = $program ?? Program::findOrFail($programId);

        $base = Research::query()
            ->where('program_id', $programId)
            ->where('status', '!=', ResearchStatus::ARCHIVED->value)
            ->whereBetween('published_year', [$startYear, $endYear]);

        $total = (clone $base)->count();
        
        $topAlignments = [];
        
        if ($total > 0) {
            $topAlignments = $this->alignmentService->getTopAlignments($programId, $startYear, $endYear, $total);
        }

        return [
            'program_id' => $program->id,
            'program_name' => $program->name,
            'program_code' => $program->code,
            'count' => $total,
            'top_alignments' => $topAlignments,
        ];
    }

    /**
     * Get detailed program view with yearly breakdown.
     *
     * @param int $programId
     * @param int $startYear
     * @param int $endYear
     * @return array|null
     */
    public function getProgramDetailedView(int $programId, int $startYear, int $endYear, ?string $statusFilter = null): ?array
    {
        $program = Program::find($programId);
        
        if (!$program) {
            return null;
        }

        $programBase = Research::query()
            ->where('program_id', $programId)
            ->where('status', '!=', ResearchStatus::ARCHIVED->value)
            ->whereBetween('published_year', [$startYear, $endYear]);

        if ($statusFilter && $statusFilter !== 'all') {
            $programBase->where('status', $statusFilter);
        }

        $programResearchIds = $this->alignmentService->getResearchIdsForYearRange($startYear, $endYear)
            ->where('program_id', $programId);

        // Yearly breakdown
        $yearly = (clone $programBase)
            ->select('published_year')
            ->groupBy('published_year')
            ->orderBy('published_year', 'asc')
            ->pluck('published_year');

        $yearData = $this->getYearlyBreakdown($programId, $yearly, $statusFilter);

        $totalProgram = (int) (clone $programBase)->count();
        $yearsCount = max(1, $yearData->count());
        $avgPerYear = $yearsCount ? round($totalProgram / $yearsCount) : 0;
        $peak = $yearData->sortByDesc('count')->first();

        $overallAgenda = (int) (clone $programBase)->whereHas('agendas')->count();
        $overallSdg = (int) (clone $programBase)->whereHas('sdgs')->count();
        $overallSrig = (int) (clone $programBase)->whereHas('srigs')->count();

        $programSummaryAlignments = $this->alignmentService->calculateAlignmentSummary($programBase, $totalProgram);
        $programAlignmentBreakdown = $this->alignmentService->calculateAlignmentBreakdown($programResearchIds, $totalProgram);

        return [
            'program' => [
                'id' => $program->id,
                'name' => $program->name,
                'code' => $program->code,
            ],
            'yearly' => $yearData,
            'summary' => [
                'total' => $totalProgram,
                'avg_per_year' => (int) $avgPerYear,
                'peak_year' => $peak['year'] ?? null,
                'peak_count' => $peak['count'] ?? null,
            ],
            'overall_alignments' => [
                'agenda' => $overallAgenda,
                'sdg' => $overallSdg,
                'srig' => $overallSrig,
            ],
            'alignmentSummary' => $programSummaryAlignments,
            'alignmentBreakdown' => $programAlignmentBreakdown,
            'alignmentTotal' => $totalProgram,
        ];
    }

    /**
     * Get yearly breakdown for a program.
     *
     * @param int $programId
     * @param Collection $years
     * @return Collection
     */
    protected function getYearlyBreakdown(int $programId, Collection $years, ?string $statusFilter = null): Collection
    {
        return $years->map(function ($year) use ($programId, $statusFilter) {
            $total = Research::query()
                ->where('program_id', $programId)
                ->where('published_year', $year)
                ->where('status', '!=', ResearchStatus::ARCHIVED->value)
                ->when($statusFilter && $statusFilter !== 'all', fn ($query) => $query->where('status', $statusFilter))
                ->count();
            
            $topAlignments = [];
            
            if ($total > 0) {
                $topAlignments = $this->alignmentService->getTopAlignmentsForYear($programId, $year, $total);
            }
            
            return [
                'year' => (int) $year,
                'count' => $total,
                'top_alignments' => $topAlignments,
            ];
        })->values();
    }
}
