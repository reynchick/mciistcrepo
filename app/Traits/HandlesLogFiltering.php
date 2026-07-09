<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HandlesLogFiltering
{
    /**
     * Apply a search filter if the target model exposes a scopeSearch; otherwise fall back to ID matching.
     */
    public function applySearchFilters(Builder $query, string $search): Builder
    {
        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($search) {
            if (method_exists($builder->getModel(), 'scopeSearch')) {
                $builder->search($search);
                return;
            }

            $builder->where('id', $search);
        });
    }

    /**
     * Apply created_at date range filters.
     */
    public function applyDateFilters(Builder $query, $dateFrom, $dateTo): Builder
    {
        if (!empty($dateFrom)) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if (!empty($dateTo)) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        return $query;
    }

    /**
     * Apply user-based filtering on user_id.
     */
    public function applyUserFilters(Builder $query, $userId): Builder
    {
        if (!empty($userId)) {
            $query->where('user_id', $userId);
        }

        return $query;
    }
}
