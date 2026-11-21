<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CustomAlignmentEntry extends Model
{
    protected $fillable = ['custom_alignment_category_id', 'name', 'description'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(CustomAlignmentCategory::class, 'custom_alignment_category_id');
    }

    public function researches(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'custom_alignment_entry_research')->withTimestamps();
    }
}
