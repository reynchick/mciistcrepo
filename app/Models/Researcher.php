<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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

    public function invitations(): HasMany
    {
        return $this->hasMany(ResearcherInvitation::class);
    }

    public function hasCurrentAccess(): bool
    {
        return !is_null($this->user_id);
    }

    public function hasActiveInvitation(): bool
    {
        return $this->invitations()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where(function ($query): void {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    public function hasExpiredUnacceptedInvitation(): bool
    {
        return $this->invitations()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->exists();
    }

    public function revokeAccess(): void
    {
        $this->forceFill(['user_id' => null])->save();
    }

    public function revokePendingInvitations(): void
    {
        $this->invitations()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }
}