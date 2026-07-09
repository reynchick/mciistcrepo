<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class Srig extends Model
{
    protected $fillable = ['name', 'description'];

    /**
     * Get researches linked to this SRIG.
     */
    public function researches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'research_srig')->withTimestamps();
    }

    /**
     * Scope a query to filter SRIGs by name.
     */
    public function scopeByName(Builder $query, string $name): Builder
    {
        return $query->where('name', 'like', "%{$name}%");
    }

    /**
     * Get the count of researches associated with this SRIG.
     */
    public function getResearchCountAttribute(): int
    {
        return $this->researches()->count();
    }

    /**
     * Get active researches linked to this SRIG (non-archived).
     */
    public function activeResearches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'research_srig')
            ->whereNull('researches.archived_at')
            ->withTimestamps();
    }
}