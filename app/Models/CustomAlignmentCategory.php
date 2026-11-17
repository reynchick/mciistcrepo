<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * An admin-defined alignment category (e.g. "National Development Priority"),
 * separate from the built-in SDG, SRIG, and Agenda tables.
 */
class CustomAlignmentCategory extends Model
{
    /** Names reserved for the built-in categories (compared case-insensitively). */
    public const RESERVED_NAMES = ['sdg', 'sdgs', 'srig', 'srigs', 'agenda', 'agendas'];

    protected $fillable = ['name', 'label', 'description'];

    public function entries(): HasMany
    {
        return $this->hasMany(CustomAlignmentEntry::class);
    }

    /**
     * Number of distinct research records linked to any entry in this category.
     */
    public function linkedResearchCount(): int
    {
        return CustomAlignmentEntry::query()
            ->join('custom_alignment_entry_research', 'custom_alignment_entries.id', '=', 'custom_alignment_entry_research.custom_alignment_entry_id')
            ->where('custom_alignment_entries.custom_alignment_category_id', $this->getKey())
            ->distinct()
            ->count('custom_alignment_entry_research.research_id');
    }

    /**
     * Categories with their entries and usage counts, shaped for the admin page.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function forManagementPage(): array
    {
        return static::query()
            ->with(['entries' => fn ($query) => $query->withCount('researches')->orderBy('name')])
            ->orderBy('id')
            ->get()
            ->map(fn (self $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'label' => $category->label,
                'description' => $category->description,
                'entries' => $category->entries->map(fn (CustomAlignmentEntry $entry): array => [
                    'id' => $entry->id,
                    'name' => $entry->name,
                    'description' => $entry->description,
                    'researches_count' => (int) $entry->researches_count,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }
}
