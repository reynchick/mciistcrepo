<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait ResearchScopes
{
    public function scopeByProgram(Builder $query, $programId)
    {
        return $query->where('program_id', $programId);
    }

    public function scopeByAdviser(Builder $query, $adviserId)
    {
        return $query->where('research_adviser', $adviserId);
    }

    public function scopeByYear(Builder $query, $year)
    {
        return $query->where('published_year', $year);
    }

    public function scopeByPanelist(Builder $query, $facultyId)
    {
        return $query->whereHas('panelists', function ($q) use ($facultyId) {
            $q->where('faculty_id', $facultyId);
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    public function scopeFilter(Builder $query, array $filters): Builder
    {
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }
        if (!empty($filters['years'])) {
            $query->whereIn('published_year', array_map('intval', $filters['years']));
        }
        if (!empty($filters['programs'])) {
            $query->whereIn('program_id', array_map('intval', $filters['programs']));
        }
        if (!empty($filters['advisers'])) {
            $query->whereIn('research_adviser', array_map('intval', $filters['advisers']));
        }
        if (array_key_exists('archived', $filters)) {
            $filters['archived'] ? $query->archived() : $query->active();
        }
        return $query;
    }
}
