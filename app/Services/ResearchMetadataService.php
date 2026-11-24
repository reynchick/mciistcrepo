<?php

namespace App\Services;

use App\Models\Research;
use App\Support\DublinCoreTerms;
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
     * @param  array<int, array{term:string, value:string, scheme?:?string, sort_order?:int}> $values
     * @return array<int, array{term:string, value:string, scheme:?string, sort_order:int}>
     */
    protected function normalizeValues(array $values): array
    {
        return collect($values)->map(function (array $metadata, int $index): array {
            $term = strtolower(trim((string) ($metadata['term'] ?? '')));
            $value = trim((string) ($metadata['value'] ?? ''));

            if (! DublinCoreTerms::isSupported($term)) {
                throw ValidationException::withMessages([
                    'metadata' => "Unsupported Dublin Core term: {$term}.",
                ]);
            }

            if (DublinCoreTerms::isDerived($term)) {
                throw ValidationException::withMessages([
                    'metadata' => "The {$term} value is derived from the core research record.",
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
