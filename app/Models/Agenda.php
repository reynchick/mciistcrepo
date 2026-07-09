<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

class Agenda extends Model
{
    protected $fillable = ['name', 'description'];

    /**
     * Get the researches linked to this agenda.
     */
    public function researches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'research_agenda')->withTimestamps();
    }

    /**
     * Scope a query to filter agendas by name.
     */
    public function scopeByName(Builder $query, string $name): Builder
    {
        return $query->where('name', 'like', "%{$name}%");
    }

    /**
     * Get the count of researches associated with this agenda.
     */
    public function getResearchCountAttribute(): int
    {
        return $this->researches()->count();
    }

    /**
     * Get active researches linked to this agenda (non-archived).
     */
    public function activeResearches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'research_agenda')
            ->whereNull('researches.archived_at')
            ->withTimestamps();
    }
}