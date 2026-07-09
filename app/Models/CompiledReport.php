<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompiledReport extends Model
{

    protected $fillable = [
        'report_type_id',
        'report_format_id',
        'generated_by',
        'generated_on',
        'filters_applied',
        'file_path',
    ];

    protected $casts = [
        'filters_applied' => 'array',
        'generated_on' => 'datetime',
    ];

    /**
     * Get the report type associated with this compiled report.
     */
    public function reportType(): BelongsTo
    {
        return $this->belongsTo(ReportType::class);
    }

    /**
     * Get the report format associated with this compiled report.
     */
    public function reportFormat(): BelongsTo
    {
        return $this->belongsTo(ReportFormat::class);
    }

    /**
     * Get the user who generated this compiled report.
     */
    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}