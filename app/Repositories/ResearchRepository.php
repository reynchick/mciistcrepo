<?php

namespace App\Repositories;

use App\Models\Research;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ResearchRepository
{
    /**
     * Base query with common eager loads.
     */
    public function queryWithRelations(): Builder
    {
        return Research::with([
            'program:id,name',
            'adviser:id,first_name,middle_name,last_name',
            'researchers:id,research_id,first_name,middle_name,last_name',
            'keywords:id,keyword_name',
        ]);
    }

    /**
     * Normalize browse filters from request.
     */
    public function normalizeFilters(Request $request): array
    {
        $years = collect((array) $request->input('years', []))
            ->map(fn($v) => (int) $v)
            ->filter()
            ->values()
            ->all();

        $programs = collect((array) $request->input('programs', []))
            ->map(fn($v) => (int) $v)
            ->filter()
            ->values()
            ->all();

        $advisers = collect((array) $request->input('advisers', []))
            ->map(fn($v) => (int) $v)
            ->filter()
            ->values()
            ->all();

        return [
            'search' => (string) $request->input('search', ''),
            'years' => $years,
            'programs' => $programs,
            'advisers' => $advisers,
            'archived' => $request->boolean('archived', false),
            'panelist' => $request->input('panelist'),
            'year' => $request->input('year'),
            'program' => $request->input('program'),
            'adviser' => $request->input('adviser'),
        ];
    }

    /**
     * Years facet for filters.
     */
    public function facetYears(): Collection
    {
        return Research::published()
            ->selectRaw('published_year, COUNT(*) as count')
            ->groupBy('published_year')
            ->orderBy('published_year', 'desc')
            ->get()
            ->map(fn($row) => [
                'year' => (int) $row->published_year,
                'count' => (int) $row->count,
            ]);
    }

    /**
     * Apply filters to a query builder.
     */
    public function applyFilters(Builder $query, array $filters): Builder
    {
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (!empty($filters['years'])) {
            $query->whereIn('published_year', array_map('intval', (array) $filters['years']));
        }

        if (!empty($filters['programs'])) {
            $query->whereIn('program_id', array_map('intval', (array) $filters['programs']));
        }

        if (!empty($filters['advisers'])) {
            $query->whereIn('research_adviser', array_map('intval', (array) $filters['advisers']));
        }

        if (!empty($filters['panelist'])) {
            $query->byPanelist($filters['panelist']);
        }

        if (!empty($filters['year'])) {
            $query->byYear($filters['year']);
        }

        if (!empty($filters['program'])) {
            $query->byProgram($filters['program']);
        }

        if (!empty($filters['adviser'])) {
            $query->byAdviser($filters['adviser']);
        }

        if (!empty($filters['status'])) {
            $query->byStatusFilter((string) $filters['status']);
        } elseif (array_key_exists('archived', $filters)) {
            $filters['archived'] ? $query->archived() : $query->active();
        }

        return $query;
    }

    /**
     * Paginate with filters applied.
     */
    public function paginateFiltered(array $filters, int $perPage = 12): LengthAwarePaginator
    {
        $query = $this->queryWithRelations();
        $this->applyFilters($query, $filters);

        return $query
            ->paginate($perPage)
            ->withQueryString();
    }
}
