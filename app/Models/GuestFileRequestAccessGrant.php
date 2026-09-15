<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestFileRequestAccessGrant extends Model
{
    protected $fillable = [
        'guest_file_request_id', 'guest_user_id', 'research_id', 'file_type', 'granted_at', 'revoked_at',
    ];

    protected $casts = ['granted_at' => 'datetime', 'revoked_at' => 'datetime'];

    public function request(): BelongsTo
    {
        return $this->belongsTo(GuestFileRequest::class, 'guest_file_request_id');
    }
}