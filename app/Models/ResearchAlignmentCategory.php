<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResearchAlignmentCategory extends Model
{
    protected $fillable = ['name', 'description'];

    public function entries(): HasMany
    {
        return $this->hasMany(ResearchAlignmentEntry::class, 'research_alignment_category_id');
    }

    public function researches()
    {
        return $this->belongsToMany(
            Research::class,
            'research_alignment_entry',
            'research_alignment_entry_id',
            'research_id'
        )->withTimestamps();
    }
}