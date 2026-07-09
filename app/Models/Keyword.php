<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Traits\HasSearchable;

class Keyword extends Model
{
    use HasSearchable;

    protected $fillable = [
        'keyword_id',
        'keyword_name',
    ];

    /**
     * Fields that should be searchable.
     */
    protected array $searchableFields = ['keyword_name'];

    /**
     * Get the researches that use this keyword.
     */
    public function researches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'research_keywords', 'keyword_id', 'research_id');
    }

    /**
     * Get the search logs associated with this keyword.
     */
    public function searchLogs()
    {
        return $this->hasMany(KeywordSearchLog::class, 'keyword_id');
    }



    /**
     * Get the number of times this keyword has been searched.
     */
    public function getSearchCountAttribute(): int
    {
        return $this->searchLogs()->count();
    }
}