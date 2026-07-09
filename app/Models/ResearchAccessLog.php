<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResearchAccessLog extends Model
{
    use HasFactory;
    
    protected $fillable = ['research_id', 'user_id', 'ip_address', 'user_agent'];
    
    /**
     * Get the research associated with this access log entry.
     */
    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }
    
    /**
     * Get the user who accessed the research (if authenticated).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}