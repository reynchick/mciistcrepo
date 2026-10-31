<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GuestFileRequest extends Model
{
    protected $fillable = [
        'research_id',
        'guest_session_id',
        'guest_user_id',
        'file_type',
        'status',
        'approval_policy',
        'expires_at',
        'escalated_at',
        'lead_approved_at',
        'lead_approved_by',
        'lead_email_status',
        'lead_email_sent_at',
        'lead_email_error',
        'adviser_approved_at',
        'adviser_approved_by',
        'adviser_email_status',
        'adviser_email_sent_at',
        'adviser_email_error',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
    ];

    protected $casts = [
        'lead_approved_at' => 'datetime',
        'adviser_approved_at' => 'datetime',
        'expires_at' => 'datetime',
        'escalated_at' => 'datetime',
        'rejected_at' => 'datetime',
        'lead_email_sent_at' => 'datetime',
        'adviser_email_sent_at' => 'datetime',
    ];

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function guestUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_user_id');
    }

    public function leadApprover(): BelongsTo { return $this->belongsTo(User::class, 'lead_approved_by'); }
    public function adviserApprover(): BelongsTo { return $this->belongsTo(User::class, 'adviser_approved_by'); }
    public function rejector(): BelongsTo { return $this->belongsTo(User::class, 'rejected_by'); }
    public function events(): HasMany { return $this->hasMany(GuestFileRequestEvent::class); }
    public function tokens(): HasMany { return $this->hasMany(GuestFileRequestToken::class); }
    public function accessGrant(): HasOne { return $this->hasOne(GuestFileRequestAccessGrant::class); }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['requested', 'pending', 'pending_adviser_approval', 'escalated']);
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['requested', 'pending', 'pending_adviser_approval', 'escalated'], true);
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->expires_at && $this->expires_at->isPast());
    }

    public function hasAdviserApproval(): bool
    {
        return $this->status === 'approved' && $this->adviser_approved_at !== null;
    }

    public function approve(string $approvalType, User $user): void
    {
        throw new \RuntimeException('Manuscript access approvals are no longer available.');
    }

    public function reject(User $user, ?string $reason = null): void
    {
        if (!$this->isActive()) {
            return;
        }

        $this->forceFill([
            'status' => 'rejected',
            'rejected_by' => $user->id,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ])->save();
        $this->events()->create(['user_id' => $user->id, 'event' => 'rejected', 'reason' => $reason]);
    }

    public function escalate(): void
    {
        if (!$this->isActive() || $this->status === 'escalated') {
            return;
        }

        $this->forceFill(['status' => 'escalated', 'escalated_at' => now()])->save();
        $this->events()->create(['event' => 'escalated']);
    }

    public function expire(): void
    {
        if (!$this->isActive()) {
            return;
        }

        $this->forceFill(['status' => 'expired'])->save();
        $this->events()->create(['event' => 'expired']);
    }
}
