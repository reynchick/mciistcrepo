<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ResearchAlignmentEntry extends Model
{
    protected $table = 'research_alignment_entries';

    protected $fillable = [
        'research_alignment_category_id',
        'name',
        'code',
        'description',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ResearchAlignmentCategory::class, 'research_alignment_category_id');
    }

    public function researches(): BelongsToMany
    {
        return $this->belongsToMany(
            Research::class,
            'research_alignment_entry',
            'research_alignment_entry_id',
            'research_id'
        )->withTimestamps();
    }
}