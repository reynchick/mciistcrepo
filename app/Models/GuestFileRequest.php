<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestFileRequest extends Model
{
    protected $fillable = [
        'research_id',
        'guest_session_id',
        'guest_user_id',
        'file_type',
        'status',
        'lead_approved_at',
        'adviser_approved_at',
    ];

    protected $casts = [
        'lead_approved_at' => 'datetime',
        'adviser_approved_at' => 'datetime',
    ];

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function guestUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_user_id');
    }

    public function approve(string $approvalType): void
    {
        if ($approvalType === 'lead') {
            $this->lead_approved_at = now();
        }

        if ($approvalType === 'adviser') {
            $this->adviser_approved_at = now();
        }

        $this->status = ($this->lead_approved_at && $this->adviser_approved_at)
            ? 'approved'
            : 'pending';

        $this->save();
    }
}
