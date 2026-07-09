<?php

namespace App\Services;

use App\Models\Program;
use App\Services\Statistics\AlignmentStatisticsService;
use App\Services\Statistics\CollegeStatisticsService;
use App\Services\Statistics\ProgramStatisticsService;

/**
 * ResearchStatisticsService - Facade for backward compatibility
 *
 * This service acts as a coordinator/facade that delegates to the split statistics services.
 * It maintains backward compatibility while allowing direct use of specialized services.
 *
 * @deprecated Consider using CollegeStatisticsService, ProgramStatisticsService, or AlignmentStatisticsService directly
 */
class ResearchStatisticsService
{
    public function __construct(
        protected CollegeStatisticsService $collegeService,
        protected ProgramStatisticsService $programService,
        protected AlignmentStatisticsService $alignmentService,
    ) {}

    /**
     * Get college-wide statistics for a year range
     * Delegates to CollegeStatisticsService
     */
    public function getCollegeStatistics(int $startYear, int $endYear): array
    {
        return $this->collegeService->getCollegeStatistics($startYear, $endYear);
    }

    /**
     * Get statistics for a specific program
     * Delegates to ProgramStatisticsService
     */
    public function getProgramStatistics(int $programId, int $startYear, int $endYear, ?Program $program = null): array
    {
        return $this->programService->getProgramStatistics($programId, $startYear, $endYear, $program);
    }

    /**
     * Get detailed program view with yearly breakdown
     * Delegates to ProgramStatisticsService
     */
    public function getProgramDetailedView(int $programId, int $startYear, int $endYear): ?array
    {
        return $this->programService->getProgramDetailedView($programId, $startYear, $endYear);
    }
}
