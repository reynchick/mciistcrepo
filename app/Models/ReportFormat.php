<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportFormat extends Model
{

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get compiled reports that use this format.
     */
    public function compiledReports(): HasMany
    {
        return $this->hasMany(CompiledReport::class);
    }
}