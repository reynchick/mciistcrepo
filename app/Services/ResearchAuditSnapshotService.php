<?php

namespace App\Services;

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;

class ResearchAuditSnapshotService
{
    /**
     * Capture the research state using display-safe values rather than database IDs or file paths.
     *
     * @return array<string, mixed>
     */
    public function capture(Research $research): array
    {
        $research->load([
            'adviser:id,first_name,middle_name,last_name',
            'program:id,name',
            'researchers:id,research_id,first_name,middle_name,last_name,is_lead_author',
            'metadataValues:id,research_id,term,value,scheme,sort_order',
            'keywords:id,keyword_name',
            'panelists:id,first_name,middle_name,last_name',
            'agendas:id,name',
            'sdgs:id,name',
            'srigs:id,name',
            'alignmentEntries:id,name,code',
        ]);

        return [
            'research_title' => $research->research_title,
            'adviser' => $research->adviser?->full_name,
            'program' => $research->program?->name,
            'completed_month' => $research->completed_month,
            'completed_year' => $research->completed_year,
            'research_abstract' => $research->research_abstract,
            'manuscript_available' => (bool) $research->research_manuscript,
            'manuscript_file_signature' => $research->research_manuscript
                ? hash('sha256', $research->research_manuscript)
                : null,
            'physical_attributes' => $research->physical_attributes ?? [],
            'status' => $research->status?->value ?? $research->status,
            'manuscript_unavailable' => $research->manuscript_unavailable_legacy_at !== null,
            'panelists_unavailable' => $research->panelists_unavailable_legacy_at !== null,
            'posted_at' => $research->posted_at?->toISOString(),
            'archived_at' => $research->archived_at?->toISOString(),
            'archive_reason' => $research->archive_reason,
            'researchers' => $research->researchers
                ->map(fn ($researcher): array => [
                    'first_name' => $researcher->first_name,
                    'middle_name' => $researcher->middle_name,
                    'last_name' => $researcher->last_name,
                    'is_lead_author' => (bool) $researcher->is_lead_author,
                ])
                ->values()
                ->all(),
            'metadata_values' => $research->metadataValues
                ->sortBy([
                    ['term', 'asc'],
                    ['sort_order', 'asc'],
                    ['id', 'asc'],
                ])
                ->map(fn ($metadata): array => [
                    'term' => $metadata->term,
                    'value' => $metadata->value,
                    'scheme' => $metadata->scheme,
                ])
                ->values()
                ->all(),
            'keywords' => $research->keywords->pluck('keyword_name')->sort()->values()->all(),
            'panelists' => $research->panelists->map(fn ($person): string => $this->fullName($person))->sort()->values()->all(),
            'agendas' => $research->agendas->pluck('name')->sort()->values()->all(),
            'sdgs' => $research->sdgs->pluck('name')->sort()->values()->all(),
            'srigs' => $research->srigs->pluck('name')->sort()->values()->all(),
            'alignment_entries' => $research->alignmentEntries
                ->map(fn ($entry): string => filled($entry->code) ? "{$entry->code}: {$entry->name}" : $entry->name)
                ->sort()
                ->values()
                ->all(),
        ];
    }

    /**
     * Persist one audit event containing only fields that actually changed.
     *
     * @param  array<string, mixed>  $oldSnapshot
     * @param  array<string, mixed>  $newSnapshot
     */
    public function recordChanges(
        Research $research,
        array $oldSnapshot,
        array $newSnapshot,
        User $actor,
        string $source,
    ): ?ResearchEntryLog {
        $changed = [];
        foreach ($newSnapshot as $field => $newValue) {
            if (($oldSnapshot[$field] ?? null) !== $newValue) {
                $changed[] = $field;
            }
        }

        if ($changed === []) {
            return null;
        }

        $oldValues = array_intersect_key($oldSnapshot, array_flip($changed));
        $newValues = array_intersect_key($newSnapshot, array_flip($changed));
        if (in_array('manuscript_file_signature', $changed, true)) {
            $changed = array_values(array_diff($changed, ['manuscript_file_signature', 'manuscript_available']));
            $changed[] = 'manuscript_file';
            $oldValues['manuscript_file'] = $this->manuscriptChangeLabel(
                $oldSnapshot['manuscript_file_signature'] ?? null,
                $newSnapshot['manuscript_file_signature'] ?? null,
                true,
            );
            $newValues['manuscript_file'] = $this->manuscriptChangeLabel(
                $oldSnapshot['manuscript_file_signature'] ?? null,
                $newSnapshot['manuscript_file_signature'] ?? null,
                false,
            );
            unset(
                $oldValues['manuscript_file_signature'],
                $oldValues['manuscript_available'],
                $newValues['manuscript_file_signature'],
                $newValues['manuscript_available'],
            );
        }

        $targetSnapshot = [
            'title' => $newSnapshot['research_title'] ?? null,
            'completed_year' => $newSnapshot['completed_year'] ?? null,
            'researchers' => $newSnapshot['researchers'] ?? [],
        ];

        return ResearchEntryLog::create([
            'modified_by' => $actor->id,
            'target_research_id' => $research->id,
            'action_type' => ResearchEntryLog::ACTION_UPDATE,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => [
                'source' => $source,
                'changed' => $changed,
                'target_snapshot' => $targetSnapshot,
            ],
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }

    private function fullName(object $person): string
    {
        return collect([$person->first_name, $person->middle_name, $person->last_name])
            ->filter(fn ($part): bool => filled($part))
            ->join(' ');
    }

    private function manuscriptChangeLabel(?string $oldSignature, ?string $newSignature, bool $isOldValue): string
    {
        if ($isOldValue) {
            return $oldSignature === null ? 'No manuscript' : 'Existing manuscript';
        }

        if ($newSignature === null) {
            return 'Removed manuscript';
        }

        return $oldSignature === null ? 'Uploaded manuscript' : 'Replaced manuscript';
    }
}
