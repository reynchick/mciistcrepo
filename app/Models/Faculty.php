<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasFullName;
use App\Traits\HasSearchable;
use App\Traits\NormalizesEmail;
use Illuminate\Support\Collection;

class Faculty extends Model
{
    use HasFullName, HasSearchable, NormalizesEmail, SoftDeletes;    

    protected array $searchableFields = ['first_name', 'last_name', 'faculty_id', 'email'];
    
    protected $fillable = [
        'faculty_id',
        'first_name',
        'middle_name',
        'last_name',
        'position',
        'designation',
        'email',
        'orcid',
        'contact_number',
        'educational_attainment',
        'field_of_specialization',
        'research_interest',
        'profile_picture',
    ];

    /**
     * Get the user account associated with this faculty record.
     */
    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'faculty_id', 'faculty_id');
    }

    /**
     * Get the researches that this faculty has advised.
     */
    public function advisedResearches(): HasMany
    {
        return $this->hasMany(Research::class, 'research_adviser');
    }

     /**
     * The research panels that the faculty member belongs to.
     */
    public function paneledResearch(): BelongsToMany
    {
        return $this->belongsToMany(Research::class, 'panels')->withTimestamps();
    }

    /**
     * Get the audit logs targeting this faculty account.
     */
    public function facultyAuditLogsTargeting(): HasMany
    {
        return $this->hasMany(FacultyAuditLog::class, 'target_faculty_id');
    }



    /**
     * Check if the faculty member is a panelist for a specific research.
     */
    public function isPanelistFor(Research $research): bool
    {
        return $this->paneledResearch()->where('research.id', $research->id)->exists();
    }

    /**
     * Get the number of researches this faculty has advised and paneled.
     */
    public function getResearchCounts() {
        return [
            'advised' => $this->advisedResearches()->count(),
            'paneled' => $this->paneledResearch()->count()
        ];
    }

    public static function advisersWithActiveCounts(): Collection
    {
        return static::has('advisedResearches')
            ->select('id', 'first_name', 'middle_name', 'last_name')
            ->withCount(['advisedResearches' => function ($query) {
                $query->published();
            }])
            ->orderBy('last_name')
            ->get();
    }
}

