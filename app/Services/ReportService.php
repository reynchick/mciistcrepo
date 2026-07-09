<?php

namespace App\Services;

use App\Models\Role;
use App\Models\Research;
use App\Models\Faculty;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * Returns a map of role name => user count.
     */
    public function userRoleDistribution(): array
    {
        return Role::query()
            ->withCount('users')
            ->orderBy('users_count', 'desc')
            ->get()
            ->pluck('users_count', 'name')
            ->toArray();
    }

    /**
     * Returns top accessed research records ordered by access logs count.
     */
    public function topAccessedResearch(int $limit = 5)
    {
        return Research::query()
            ->withCount('accessLogs')
            ->orderBy('access_logs_count', 'desc')
            ->limit($limit)
            ->get();
    }

    public function facultyProductivityReport(): Collection
    {
        return Faculty::query()
            ->withCount(['advisedResearches', 'paneledResearch'])
            ->get()
            ->map(function ($faculty) {
                return [
                    'id' => $faculty->id,
                    'faculty_id' => $faculty->faculty_id,
                    'name' => $faculty->full_name,
                    'advised_count' => $faculty->advised_researches_count,
                    'paneled_count' => $faculty->paneled_research_count,
                    'total_count' => $faculty->advised_researches_count + $faculty->paneled_research_count
                ];
            });
    }

    public function exportFacultyData(): callable
    {
        $faculties = Faculty::with(['advisedResearches' => function ($query) {
            $query->with('program');
        }])->get();

        return function () use ($faculties) {
            $csv = fopen('php://output', 'w');
            
            // Headers
            fputcsv($csv, [
                'Faculty ID',
                'Name',
                'Designation',
                'Email',
                'Research Count',
                'Active Research Count'
            ]);

            // Data
            foreach ($faculties as $faculty) {
                fputcsv($csv, [
                    $faculty->faculty_id,
                    $faculty->full_name,
                    $faculty->designation,
                    $faculty->email,
                    $faculty->advised_researches_count,
                    $faculty->advised_researches->whereNull('archived_at')->count()
                ]);
            }

            fclose($csv);
        };
    }
}