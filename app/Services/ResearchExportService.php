<?php

namespace App\Services;

use App\Models\Research;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResearchExportService
{
    /**
     * Export research data to CSV
     */
    public function exportToCsv(): StreamedResponse
    {
        $researches = Research::with(['program', 'adviser', 'researchers', 'keywords'])->get();

        return response()->streamDownload(function () use ($researches) {
            $csv = fopen('php://output', 'w');
           
            // Headers
            fputcsv($csv, [
                'Title',
                'Program',
                'Adviser',
                'Researchers',
                'Keywords',
                'Year',
                'Status'
            ]);

            // Data
            foreach ($researches as $research) {
                fputcsv($csv, [
                    $research->research_title,
                    $research->program->name,
                    $research->adviser->full_name ?? 'N/A',
                    $research->researchers->pluck('full_name')->join(', '),
                    $research->keywords->pluck('keyword_name')->join(', '),
                    $research->published_year,
                    $research->isArchived() ? 'Archived' : 'Active'
                ]);
            }

            fclose($csv);
        }, 'research-data.csv');
    }

    /**
     * Get research statistics data
     */
    public function getStatistics(): array
    {
        return [
            'total_research' => Research::count(),
            'active_research' => Research::active()->count(),
            'archived_research' => Research::archived()->count(),
            'by_program' => \App\Models\Program::withCount('researches')->get(),
            'by_year' => Research::select('published_year')
                ->get()
                ->groupBy('published_year')
                ->map->count(),
            'by_adviser' => \App\Models\Faculty::has('advisedResearches')
                ->withCount('advisedResearches')
                ->get()
        ];
    }
}
