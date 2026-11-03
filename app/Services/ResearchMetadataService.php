<?php

namespace App\Services;

use App\Models\Research;
use App\Models\ResearchMetadataValue;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ResearchMetadataService
{
    /**
     * Replace the Librarian-curated metadata values for a research record.
     *
     * Each item must contain a Dublin Core term, a value, and may contain
     * an encoding scheme and explicit ordering for repeated values.
     *
     * @param  array<int, array{term:string, value:string, scheme?:?string, sort_order?:int}> $values
     */
    public function replaceValues(Research $research, array $values, ?int $userId = null): void
    {
        $normalized = $this->normalizeValues($values);

        DB::transaction(function () use ($research, $normalized, $userId): void {
            $research->metadataValues()->delete();

            if ($normalized !== []) {
                $research->metadataValues()->createMany(array_map(
                    fn (array $metadata): array => $metadata + [
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ],
                    $normalized
                ));
            }
        });
    }

    /**
     * Replace the Dublin Core creator values using existing researchers.
     *
     * Researchers remain the source records; this only creates the
     * Librarian-curated metadata representation.
     *
     * @param  array<int, int|string> $researcherIds
     */
    public function replaceCreators(Research $research, array $researcherIds, ?int $userId = null): void
    {
        $ids = collect($researcherIds)
            ->map(fn ($id): int => (int) $id)
            ->filter(fn (int $id): bool => $id > 0)
            ->unique()
            ->values();

        $researchers = $research->researchers()
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        $missingIds = $ids->reject(fn (int $id): bool => $researchers->has($id));
        if ($missingIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'creator_ids' => 'One or more selected creators are not researchers for this research.',
            ]);
        }

        DB::transaction(function () use ($research, $researchers, $ids, $userId): void {
            $research->metadataValues()->where('term', 'creator')->delete();

            $research->metadataValues()->createMany(
                $ids->values()->map(function (int $id, int $sortOrder) use ($researchers, $userId): array {
                    return [
                        'term' => 'creator',
                        'value' => $researchers->get($id)->full_name,
                        'sort_order' => $sortOrder,
                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ];
                })->all()
            );
        });
    }

    /**
     * @param  array<int, array{term:string, value:string, scheme?:?string, sort_order?:int}> $values
     * @return array<int, array{term:string, value:string, scheme:?string, sort_order:int}>
     */
    protected function normalizeValues(array $values): array
    {
        return collect($values)->map(function (array $metadata, int $index): array {
            $term = strtolower(trim((string) ($metadata['term'] ?? '')));
            $value = trim((string) ($metadata['value'] ?? ''));

            if (! in_array($term, ResearchMetadataValue::TERMS, true)) {
                throw ValidationException::withMessages([
                    'metadata' => "Unsupported Dublin Core term: {$term}.",
                ]);
            }

            if ($value === '') {
                throw ValidationException::withMessages([
                    'metadata' => "The {$term} metadata value cannot be empty.",
                ]);
            }

            return [
                'term' => $term,
                'value' => $value,
                'scheme' => ($scheme = trim((string) ($metadata['scheme'] ?? ''))) !== '' ? $scheme : null,
                'sort_order' => max(0, (int) ($metadata['sort_order'] ?? $index)),
            ];
        })->values()->all();
    }
}
