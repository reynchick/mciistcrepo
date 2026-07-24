<?php

namespace App\Services\Reports;

use Illuminate\Support\Collection;

/**
 * Pure, stateless formatting helpers shared by MatrixReportService and
 * CompiledReportService. No dependencies on the request, the database,
 * or any report-specific logic — just "given this data, return this string."
 */
class ReportFormatter
{
    /**
     * Format a collection of people (Faculty/Researcher models) into a
     * comma-separated "First M. Last" list. Drops null entries (e.g. a
     * research record with no adviser assigned).
     */
    public static function formatPeople(?Collection $people): string
    {
        if (!$people) {
            return 'N/A';
        }

        $people = $people->filter(); // drop null entries (e.g. missing adviser)

        if ($people->isEmpty()) {
            return 'N/A';
        }

        return $people->map(function ($p) {
            $middle = !empty($p->middle_name) ? ' ' . substr($p->middle_name, 0, 1) . '.' : '';
            return trim("{$p->first_name}{$middle} {$p->last_name}");
        })->implode(', ');
    }

    /**
     * Format a collection of tagged items (SDGs, SRIGs, Agendas, Keywords)
     * into a comma-separated list of a given field, sanitized for safe
     * embedding in PDF/DOCX output.
     */
    public static function formatTagList(?Collection $items, string $field = 'name'): string
    {
        if (!$items || $items->isEmpty()) {
            return 'None';
        }

        return $items->pluck($field)
            ->map(fn ($v) => self::sanitizeText($v))
            ->implode(', ');
    }

    /**
     * Format a published month/year pair into a display string.
     * Falls back gracefully when month or year is missing.
     */
    public static function formatMonthYear(?int $month, ?int $year): string
    {
        if (!$year) {
            return 'N/A';
        }

        if (!$month) {
            return (string) $year;
        }

        $months = [
            '', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];

        return "{$months[$month]} {$year}";
    }

    /**
     * Sanitize free-text (e.g. abstracts, titles) so it doesn't break
     * PDF/DOCX generation: strips invalid UTF-8, strips control characters
     * that break XML, and escapes bare ampersands.
     */
    public static function sanitizeText($text): string
    {
        if ($text === null) {
            return '';
        }

        $text = (string) $text;

        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8'); // force-drop invalid bytes
        }

        // Strip control characters that break XML (keep normal whitespace)
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? $text;

        // Escape bare ampersands that aren't already a valid XML entity
        // (fixes "R& D", "Rice & Corn", etc. causing xmlParseEntityRef errors)
        $text = preg_replace('/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9A-Fa-f]+;)/', '&amp;', $text) ?? $text;

        return $text;
    }
}