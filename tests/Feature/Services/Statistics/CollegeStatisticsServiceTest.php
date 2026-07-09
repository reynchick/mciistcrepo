<?php

use App\Models\Program;
use App\Services\Statistics\AlignmentStatisticsService;
use App\Services\Statistics\CollegeStatisticsService;
use App\Services\Statistics\ProgramStatisticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery as M;

uses(RefreshDatabase::class);

test('college statistics aggregates program data and alignment summaries', function () {
    $programA = Program::factory()->create(['name' => 'Program A', 'code' => 'PA']);
    $programB = Program::factory()->create(['name' => 'Program B', 'code' => 'PB']);

    $programService = M::mock(ProgramStatisticsService::class);
    $programService->shouldReceive('getProgramStatistics')
        ->once()->with($programA->id, 2020, 2024, M::type(Program::class))
        ->andReturn([
            'program_id' => $programA->id,
            'program_name' => 'Program A',
            'count' => 3,
        ]);
    $programService->shouldReceive('getProgramStatistics')
        ->once()->with($programB->id, 2020, 2024, M::type(Program::class))
        ->andReturn([
            'program_id' => $programB->id,
            'program_name' => 'Program B',
            'count' => 5,
        ]);

    $alignmentService = M::mock(AlignmentStatisticsService::class);
    $alignmentService->shouldReceive('getResearchIdsForYearRange')
        ->once()->with(2020, 2024)->andReturn([1, 2, 3]);
    $alignmentService->shouldReceive('calculateAlignmentSummary')
        ->once()->with(M::type(Illuminate\Database\Eloquent\Builder::class), 8)
        ->andReturn(collect(['summary' => true]));
    $alignmentService->shouldReceive('calculateAlignmentBreakdown')
        ->once()->with([1, 2, 3], 8)->andReturn(collect(['breakdown' => true]));

    $service = new CollegeStatisticsService($programService, $alignmentService);

    $result = $service->getCollegeStatistics(2020, 2024);

    expect($result['totals']['total'])->toBe(8);
    expect($result['mostProductiveProgram'])->toBe('Program B');
    expect($result['alignmentSummary']->toArray())->toBe(['summary' => true]);
    expect($result['alignmentBreakdown']->toArray())->toBe(['breakdown' => true]);
});

test('college statistics handles zero programs gracefully', function () {
    $programService = Mockery::mock(ProgramStatisticsService::class);
    $alignmentService = M::mock(AlignmentStatisticsService::class);

    $alignmentService->shouldReceive('getResearchIdsForYearRange')->once()->andReturn([]);
    $alignmentService->shouldReceive('calculateAlignmentSummary')
        ->once()->with(M::type(Illuminate\Database\Eloquent\Builder::class), 0)
        ->andReturn(collect());
    $alignmentService->shouldReceive('calculateAlignmentBreakdown')
        ->once()->with([], 0)->andReturn(collect());

    $service = new CollegeStatisticsService($programService, $alignmentService);

    $result = $service->getCollegeStatistics(2020, 2024);

    expect($result['totals']['total'])->toBe(0);
    expect($result['programs'])->toHaveCount(0);
    expect($result['alignmentSummary']->toArray())->toBe([]);
});
