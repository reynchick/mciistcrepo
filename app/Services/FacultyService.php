<?php

namespace App\Services;

use App\Models\Role;
use App\Models\Research;
use App\Models\Faculty;
use Illuminate\Support\Collection;

class FacultyService
{
    /**
     * Find a faculty record by email.
     *
     * @param string $email
     * @return Faculty|null
     */
    public function findByEmail(string $email): ?Faculty
    {
        // Case-insensitive email match
        return Faculty::whereRaw('LOWER(email) = ?', [strtolower(trim($email))])->first();
    }

    public function getFacultyStatistics(Faculty $faculty): array
    {
        return [
            'total_researches' => $faculty->advisedResearches()->count(),
            'active_researches' => $faculty->advisedResearches()->whereNull('archived_at')->count(),
            'by_program' => $faculty->advisedResearches()
                ->select('program_id')
                ->with('program')
                ->get()
                ->groupBy('program.name')
                ->map->count(),
            'by_year' => $faculty->advisedResearches()
                ->select('published_year')
                ->get()
                ->groupBy('published_year')
                ->map->count()
        ];
    }
}