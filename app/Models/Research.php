<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;
use App\Traits\ResearchScopes;
use App\Models\Sdg;
use App\Models\Srig;
use App\Traits\HasSearchable;

class Research extends Model
{
    /** @use HasFactory<\Database\Factories\ResearchFactory> */
    use HasFactory, HasSearchable, ResearchScopes;

    protected $table = 'researches';

    protected $fillable = [
        'uploaded_by',
        'research_title',
        'research_adviser',
        'program_id',
        'published_month',
        'published_year',
        'research_abstract',
        'research_approval_sheet',
        'research_manuscript',
        'archived_at',
        'archived_by',
        'archive_reason',
    ];

    /**
     * Fields that should be searchable.
     * Use dot notation for relation searches (e.g., 'keywords.keyword_name').
     */
    protected array $searchableFields = [
        'research_title',
        'research_abstract',
        'keywords.keyword_name',
        'adviser.first_name',
        'adviser.last_name',
        'researchers.first_name',
        'researchers.last_name'
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'archived_at' => 'datetime',
        'published_month' => 'integer',
        'published_year' => 'integer',
    ];

    /**
     * Get the user who uploaded this research.
     */
    public function uploadedBy(): BelongsTo 
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the faculty adviser for this research.
     */
    public function adviser(): BelongsTo
    {
        return $this->belongsTo(Faculty::class, 'research_adviser');
    }

    /**
     * Get the program this research belongs to.
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    /**
     * Get the researchers for this research.
     */
    public function researchers(): HasMany
    {
        return $this->hasMany(Researcher::class);
    }

    /**
     * Get the keywords associated with this research.
     */
    public function keywords(): BelongsToMany
    {
        return $this->belongsToMany(Keyword::class, 'research_keywords')->withTimestamps();
    }

    /**
     * Get the panelists for this research.
     */
    public function panelists(): BelongsToMany
    {
        return $this->belongsToMany(Faculty::class, 'panels')->withTimestamps();
    }

    /**
     * Get the user who archived this research.
     */
    public function archiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    /**
     * Agendas associated with this research.
     */
    public function agendas(): BelongsToMany
    {
        return $this->belongsToMany(Agenda::class, 'research_agenda')->withTimestamps();
    }

    /**
     * Get the SDGs associated with this research.
     */
    public function sdgs(): BelongsToMany
    {
        return $this->belongsToMany(Sdg::class, 'research_sdg')->withTimestamps();
    }

    /**
     * Get the SRIGs associated with this research.
     */
    public function srigs(): BelongsToMany
    {
        return $this->belongsToMany(Srig::class, 'research_srig')->withTimestamps();
    }

    /**
     * Get the access logs associated with this research.
     */
    public function accessLogs(): HasMany {
        return $this->hasMany(ResearchAccessLog::class);
    }

    /**
     * Get the entry logs associated with this research.
     */
    public function researchEntryLogsTargeting(): HasMany {
        return $this->hasMany(ResearchEntryLog::class, 'target_research_id');
    }

    /**
     * Check if the research is archived.
     */
    public function isArchived(): bool
    {
        return !is_null($this->archived_at);
    }

    /**
     * Archive the research.
     */
    public function archive(User $user, string $reason = null): bool
    {
        return $this->update([
            'archived_at' => now(),
            'archived_by' => $user->id,
            'archive_reason' => $reason,
        ]);
    }

    /**
     * Restore the research from archive.
     */
    public function restore(): bool
    {
        return $this->update([
            'archived_at' => null,
            'archived_by' => null,
            'archive_reason' => null,
        ]);
    }

    /**
     * Get the number of times this research was accessed.
     */
    public function getAccessCountAttribute(): int
    {
        return $this->accessLogs()->count();
    }

    /**
     * Get the completion date as a formatted string.
     */
    public function getPublicationDateAttribute(): string
    {
        if ($this->published_month) {
            $monthName = date('F', mktime(0, 0, 0, $this->published_month, 1));
            return "{$monthName} {$this->published_year}";
        }
        
        return (string) $this->published_year;
    }

    /**
     * Get the title attribute (alias for research_title).
     */
    public function getTitleAttribute(): string
    {
        return $this->research_title ?? '';
    }
    
    /**
     * Clean up files when research is deleted.
     */
    protected static function boot()
    {
        parent::boot();

        // Delete stored files when a research record is being removed.
        static::deleting(function($research) {
            if ($research->research_approval_sheet) {
                Storage::disk('public')->delete($research->research_approval_sheet);
            }
            if ($research->research_manuscript) {
                Storage::disk('public')->delete($research->research_manuscript);
            }
        });
    }

}
