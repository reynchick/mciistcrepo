<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchMetadataValue extends Model
{
    use HasFactory;

    public const TERMS = [
        'title',
        'creator',
        'subject',
        'description',
        'publisher',
        'contributor',
        'date',
        'type',
        'format',
        'identifier',
        'source',
        'language',
        'relation',
        'coverage',
        'rights',
    ];

    protected $fillable = [
        'research_id',
        'term',
        'value',
        'scheme',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
