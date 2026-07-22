<?php

namespace App\Services\Statistics;

use App\Models\Program;
use App\Models\Research;

class CollegeStatisticsService
{
    public function __construct(
        protected ProgramStatisticsService $programService,
        protected AlignmentStatisticsService $alignmentService
    ) {}

    /**
     * Get college-wide statistics for a year range.
     *
     * This service orchestrates program and alignment statistics to provide
     * a comprehensive view of research activities across all programs.
     *
     * @param int $startYear Start year for statistics
     * @param int $endYear End year for statistics
     * @return array College-wide statistics
     */
    public function getCollegeStatistics(int $startYear, int $endYear): array
    {
        // Get all programs
        $programs = Program::select('id', 'name', 'code')->get();

        // Get statistics for each program using the program service
        $programData = $programs->map(function ($program) use ($startYear, $endYear) {
            return $this->programService->getProgramStatistics(
                $program->id,
                $startYear,
                $endYear,
                $program
            );
        })->values();

        // Calculate total research count across all programs
        $totalAll = (int) $programData->sum('count');

        // Get research IDs for alignment calculations
        $researchIds = $this->alignmentService->getResearchIdsForYearRange($startYear, $endYear);

        // Calculate alignment statistics for the entire college
        $overallBase = Research::query()
            ->where('status', '!=', ResearchStatus::ARCHIVED->value)
            ->whereBetween('published_year', [$startYear, $endYear]);

        $summaryAlignments = $this->alignmentService->calculateAlignmentSummary($overallBase, $totalAll);
        $alignmentBreakdown = $this->alignmentService->calculateAlignmentBreakdown($researchIds, $totalAll);

        // Find the most productive program
        $mostProductive = $programData->sortByDesc('count')->first();

        return [
            'yearStart' => $startYear,
            'yearEnd' => $endYear,
            'programs' => $programData,
            'totals' => [
                'total' => $totalAll,
            ],
            'mostProductiveProgram' => $mostProductive['program_name'] ?? null,
            'alignmentSummary' => $summaryAlignments,
            'alignmentBreakdown' => $alignmentBreakdown,
        ];
    }
}
