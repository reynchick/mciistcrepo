<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasFullName;
use App\Traits\HasSearchable;
use App\Traits\NormalizesEmail;

class Researcher extends Model
{
    use HasFullName, HasSearchable, NormalizesEmail;

    protected $fillable = [
        'research_id',
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'is_lead_author',
    ];

    protected $casts = [
        'is_lead_author' => 'boolean',
    ];

    protected array $searchableFields = ['first_name', 'last_name', 'email'];

    /**
     * Get the research this researcher belongs to.
     */
    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class, 'research_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hasCurrentAccess(): bool
    {
        return !is_null($this->user_id);
    }

    public function revokeAccess(): void
    {
        $this->forceFill(['user_id' => null])->save();
    }

}