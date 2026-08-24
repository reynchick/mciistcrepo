<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearcherInvitation extends Model
{
    protected $fillable = [
        'researcher_id',
        'token_hash',
        'email_snapshot',
        'expires_at',
        'revoked_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function researcher(): BelongsTo
    {
        return $this->belongsTo(Researcher::class);
    }

    public function isActive(): bool
    {
        return ! $this->isAccepted()
            && ! $this->isRevoked()
            && ! $this->isExpired();
    }

    public function isExpired(): bool
    {
        return ! is_null($this->expires_at)
            && $this->expires_at->isPast()
            && ! $this->isAccepted()
            && ! $this->isRevoked();
    }

    public function isAccepted(): bool
    {
        return ! is_null($this->accepted_at);
    }

    public function isRevoked(): bool
    {
        return ! is_null($this->revoked_at);
    }
}
