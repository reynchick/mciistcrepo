<?php

namespace App\Services\Statistics;

use App\Models\Research;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AlignmentStatisticsService
{
    /**
     * Get research IDs for a year range.
     *
     * @param int $startYear
     * @param int $endYear
     * @return mixed Database query builder
     */
    public function getResearchIdsForYearRange(int $startYear, int $endYear)
    {
        return DB::table('researches')
            ->select('id')
            ->whereNull('archived_at')
            ->whereBetween('published_year', [$startYear, $endYear]);
    }

    /**
     * Calculate alignment summary (agenda, sdg, srig percentages).
     *
     * @param mixed $baseQuery Base research query
     * @param int $total Total research count
     * @return Collection Alignment summary data
     */
    public function calculateAlignmentSummary($baseQuery, int $total): Collection
    {
        $agendaAll = (clone $baseQuery)->whereHas('agendas')->count();
        $sdgAll = (clone $baseQuery)->whereHas('sdgs')->count();
        $srigAll = (clone $baseQuery)->whereHas('srigs')->count();

        return collect([
            [
                'type' => 'agenda',
                'label' => 'Agenda',
                'count' => (int) $agendaAll,
                'percentage' => $total > 0 ? round(($agendaAll / $total) * 100, 1) : 0,
            ],
            [
                'type' => 'sdg',
                'label' => 'SDG',
                'count' => (int) $sdgAll,
                'percentage' => $total > 0 ? round(($sdgAll / $total) * 100, 1) : 0,
            ],
            [
                'type' => 'srig',
                'label' => 'SRIG',
                'count' => (int) $srigAll,
                'percentage' => $total > 0 ? round(($srigAll / $total) * 100, 1) : 0,
            ],
        ])->sortByDesc('percentage')->values();
    }

    /**
     * Calculate detailed alignment breakdown by individual items.
     *
     * @param mixed $researchIds Research IDs query
     * @param int $total Total research count
     * @return Collection Alignment breakdown data
     */
    public function calculateAlignmentBreakdown($researchIds, int $total): Collection
    {
        $extractCode = function (string $name): string {
            if (preg_match('/^(SDG\d+)/i', $name, $m)) return strtoupper($m[1]);
            if (preg_match('/^(SRIG\d+)/i', $name, $m)) return strtoupper($m[1]);
            if (preg_match('/^(AGENDA\d+)/i', $name, $m)) return strtoupper($m[1]);
            return strtoupper(trim(strtok($name, ':')) ?: $name);
        };

        $orderKey = function (string $code): string {
            if (preg_match('/^(SDG|SRIG|AGENDA)(\d+)/i', $code, $m)) {
                return strtoupper($m[1]) . str_pad($m[2], 3, '0', STR_PAD_LEFT);
            }
            return strtoupper($code);
        };

        $agendaBreakdown = DB::table('agendas')
            ->leftJoinSub(
                DB::table('research_agenda')
                    ->select('agenda_id', DB::raw('COUNT(*) as cnt'))
                    ->whereIn('research_id', $researchIds)
                    ->groupBy('agenda_id'),
                'ra',
                'ra.agenda_id',
                '=',
                'agendas.id'
            )
            ->select('agendas.name', 'agendas.id', DB::raw('COALESCE(ra.cnt, 0) as count'))
            ->get()
            ->map(function ($item) use ($total, $extractCode, $orderKey) {
                $count = (int) $item->count;
                $code = $extractCode($item->name);
                return [
                    'type' => 'agenda',
                    'name' => $item->name,
                    'code' => $code,
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                    'order_key' => $orderKey($code),
                ];
            });

        $sdgBreakdown = DB::table('sdgs')
            ->leftJoinSub(
                DB::table('research_sdg')
                    ->select('sdg_id', DB::raw('COUNT(*) as cnt'))
                    ->whereIn('research_id', $researchIds)
                    ->groupBy('sdg_id'),
                'rs',
                'rs.sdg_id',
                '=',
                'sdgs.id'
            )
            ->select('sdgs.name', 'sdgs.id', DB::raw('COALESCE(rs.cnt, 0) as count'))
            ->get()
            ->map(function ($item) use ($total, $extractCode, $orderKey) {
                $count = (int) $item->count;
                $code = $extractCode($item->name);
                return [
                    'type' => 'sdg',
                    'name' => $item->name,
                    'code' => $code,
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                    'order_key' => $orderKey($code),
                ];
            });

        $srigBreakdown = DB::table('srigs')
            ->leftJoinSub(
                DB::table('research_srig')
                    ->select('srig_id', DB::raw('COUNT(*) as cnt'))
                    ->whereIn('research_id', $researchIds)
                    ->groupBy('srig_id'),
                'rr',
                'rr.srig_id',
                '=',
                'srigs.id'
            )
            ->select('srigs.name', 'srigs.id', DB::raw('COALESCE(rr.cnt, 0) as count'))
            ->get()
            ->map(function ($item) use ($total, $extractCode, $orderKey) {
                $count = (int) $item->count;
                $code = $extractCode($item->name);
                return [
                    'type' => 'srig',
                    'name' => $item->name,
                    'code' => $code,
                    'count' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                    'order_key' => $orderKey($code),
                ];
            });

        return $agendaBreakdown
            ->concat($sdgBreakdown)
            ->concat($srigBreakdown)
            ->sortByDesc('percentage')
            ->values();
    }

    /**
     * Get top 5 alignments across all types for a program/year range.
     *
     * @param int $programId
     * @param int $startYear
     * @param int $endYear
     * @param int $total
     * @return array
     */
    public function getTopAlignments(int $programId, int $startYear, int $endYear, int $total): array
    {
        $researchQuery = function($query) use ($programId, $startYear, $endYear) {
            $query->select('id')
                ->from('researches')
                ->where('program_id', $programId)
                ->whereNull('archived_at')
                ->whereBetween('published_year', [$startYear, $endYear]);
        };

        // Get agenda counts
        $agendaCounts = DB::table('research_agenda')
            ->join('agendas', 'agendas.id', '=', 'research_agenda.agenda_id')
            ->whereIn('research_agenda.research_id', $researchQuery)
            ->select('agendas.name', DB::raw('COUNT(*) as count'))
            ->groupBy('agendas.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'count' => $item->count,
                'percentage' => round(($item->count / $total) * 100, 1),
            ]);
        
        // Get SDG counts
        $sdgCounts = DB::table('research_sdg')
            ->join('sdgs', 'sdgs.id', '=', 'research_sdg.sdg_id')
            ->whereIn('research_sdg.research_id', $researchQuery)
            ->select('sdgs.name', DB::raw('COUNT(*) as count'))
            ->groupBy('sdgs.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'count' => $item->count,
                'percentage' => round(($item->count / $total) * 100, 1),
            ]);
        
        // Get SRIG counts
        $srigCounts = DB::table('research_srig')
            ->join('srigs', 'srigs.id', '=', 'research_srig.srig_id')
            ->whereIn('research_srig.research_id', $researchQuery)
            ->select('srigs.name', DB::raw('COUNT(*) as count'))
            ->groupBy('srigs.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'count' => $item->count,
                'percentage' => round(($item->count / $total) * 100, 1),
            ]);
        
        // Combine all alignments and get top 5
        return $agendaCounts
            ->concat($sdgCounts)
            ->concat($srigCounts)
            ->sortByDesc('count')
            ->take(5)
            ->values()
            ->toArray();
    }

    /**
     * Get top alignments for a specific year.
     *
     * @param int $programId
     * @param int $year
     * @param int $total
     * @return array
     */
    public function getTopAlignmentsForYear(int $programId, int $year, int $total): array
    {
        $researchQuery = function($query) use ($programId, $year) {
            $query->select('id')
                ->from('researches')
                ->where('program_id', $programId)
                ->where('published_year', $year)
                ->whereNull('archived_at');
        };

        $agendaCounts = DB::table('research_agenda')
            ->join('agendas', 'agendas.id', '=', 'research_agenda.agenda_id')
            ->whereIn('research_agenda.research_id', $researchQuery)
            ->select('agendas.name', DB::raw('COUNT(*) as count'))
            ->groupBy('agendas.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'count' => $item->count,
                'percentage' => round(($item->count / $total) * 100, 1),
            ]);
        
        $sdgCounts = DB::table('research_sdg')
            ->join('sdgs', 'sdgs.id', '=', 'research_sdg.sdg_id')
            ->whereIn('research_sdg.research_id', $researchQuery)
            ->select('sdgs.name', DB::raw('COUNT(*) as count'))
            ->groupBy('sdgs.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'count' => $item->count,
                'percentage' => round(($item->count / $total) * 100, 1),
            ]);
        
        $srigCounts = DB::table('research_srig')
            ->join('srigs', 'srigs.id', '=', 'research_srig.srig_id')
            ->whereIn('research_srig.research_id', $researchQuery)
            ->select('srigs.name', DB::raw('COUNT(*) as count'))
            ->groupBy('srigs.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'count' => $item->count,
                'percentage' => round(($item->count / $total) * 100, 1),
            ]);
        
        return $agendaCounts
            ->concat($sdgCounts)
            ->concat($srigCounts)
            ->sortByDesc('count')
            ->take(5)
            ->values()
            ->toArray();
    }
}
