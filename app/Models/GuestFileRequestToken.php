<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestFileRequestToken extends Model
{
    protected $fillable = ['guest_file_request_id', 'recipient_role', 'token_hash', 'expires_at', 'used_at'];

    protected $casts = ['expires_at' => 'datetime', 'used_at' => 'datetime'];

    public function request(): BelongsTo
    {
        return $this->belongsTo(GuestFileRequest::class, 'guest_file_request_id');
    }
}