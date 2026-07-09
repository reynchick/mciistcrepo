<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class Sdg extends Model
{
    protected $fillable = ['name', 'description'];

    /**
     * Get researches linked to this Sustainable Development Goal.
     */
    public function researches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'research_sdg')->withTimestamps();
    }

    /**
     * Scope a query to filter SDGs by name.
     */
    public function scopeByName(Builder $query, string $name): Builder
    {
        return $query->where('name', 'like', "%{$name}%");
    }

    /**
     * Get the count of researches associated with this SDG.
     */
    public function getResearchCountAttribute(): int
    {
        return $this->researches()->count();
    }

    /**
     * Get active researches linked to this SDG (non-archived).
     */
    public function activeResearches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'research_sdg')
            ->whereNull('researches.archived_at')
            ->withTimestamps();
    }
}