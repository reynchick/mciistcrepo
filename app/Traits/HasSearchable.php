<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HasSearchable
{
    /**
     * Scope a query to search by multiple fields and relations (case-insensitive).
     */
    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (empty($search)) {
            return $query;
        }

        $searchTerm = strtolower($search);

        return $query->where(function ($q) use ($search, $searchTerm) {
            foreach ($this->getSearchableFields() as $field) {
                if (str_contains($field, '.')) {
                    // Handle relation searches - case insensitive
                    [$relation, $relationField] = explode('.', $field, 2);
                    $q->orWhereHas($relation, function ($relationQuery) use ($relationField, $searchTerm) {
                        $relationQuery->whereRaw("LOWER({$relationField}) LIKE ?", ["%{$searchTerm}%"]);
                    });
                } else {
                    // Handle direct field searches - case insensitive
                    $q->orWhereRaw("LOWER({$field}) LIKE ?", ["%{$searchTerm}%"]);
                }
            }
            
            // Special handling for full name searches across relations - case insensitive
            // If searching in first_name and last_name of a relation, also try concatenated search
            $relationFields = array_filter($this->getSearchableFields(), fn($f) => str_contains($f, '.'));
            $groupedByRelation = [];
            foreach ($relationFields as $field) {
                [$relation, $relationField] = explode('.', $field, 2);
                $groupedByRelation[$relation][] = $relationField;
            }
            
            foreach ($groupedByRelation as $relation => $fields) {
                // If relation has both first_name and last_name, search concatenated - case insensitive
                if (in_array('first_name', $fields) && in_array('last_name', $fields)) {
                    $q->orWhereHas($relation, function ($relationQuery) use ($searchTerm) {
                        $relationQuery->whereRaw("LOWER(CONCAT(first_name, ' ', last_name)) LIKE ?", ["%{$searchTerm}%"]);
                    });
                }
            }
        });
    }

    /**
     * Get the fields that should be searchable.
     */
    protected function getSearchableFields(): array
    {
        return $this->searchableFields ?? [];
    }
}