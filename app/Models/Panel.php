<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Panel extends Model
{
    use HasFactory;

    protected $table = 'panels';

    protected $fillable = [
        'research_id',
        'faculty_id',
    ];

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
