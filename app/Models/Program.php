<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
    ];

    /**
     * Get the researches that belong to this program.
     */
    public function researches(): HasMany
    {
        return $this->hasMany(Research::class);
    }

    public static function withActiveResearchCounts(): Collection
    {
        return static::select('id', 'name')
            ->withCount(['researches' => function ($query) {
                $query->published();
            }])
            ->get();
    }
}