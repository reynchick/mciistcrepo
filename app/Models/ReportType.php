<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportType extends Model
{

    protected $fillable = [
        'name',
        'description',
    ];

    /**
     * Get compiled reports that belong to this type.
     */
    public function compiledReports(): HasMany
    {
        return $this->hasMany(CompiledReport::class);
    }
}