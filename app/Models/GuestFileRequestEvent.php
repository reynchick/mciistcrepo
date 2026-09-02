<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestFileRequestEvent extends Model
{
    protected $fillable = ['guest_file_request_id', 'user_id', 'event', 'reason'];

    public function request(): BelongsTo
    {
        return $this->belongsTo(GuestFileRequest::class, 'guest_file_request_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}