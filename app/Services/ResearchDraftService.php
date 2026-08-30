<?php

namespace App\Services;

use App\Models\Research;
use App\Models\Researcher;
use App\Models\User;
use Illuminate\Http\UploadedFile;

class ResearchDraftService
{
    private const SNAPSHOT_FIELDS = [
        'research_title', 'research_adviser', 'program_id', 'completed_month',
        'completed_year', 'research_abstract', 'researchers', 'keywords',
        'panelists', 'agendas', 'sdgs', 'srigs',
    ];

    public function save(Research $research, User $user, array $payload, ?UploadedFile $manuscript = null): Research
    {
        $data = array_intersect_key($payload, array_flip(self::SNAPSHOT_FIELDS));

        if ($manuscript) {
            $data['research_manuscript'] = $manuscript->store('research/drafts/manuscripts', 'public');
        }

        $drafts = $research->student_drafts ?? [];
        $drafts[(string) $user->id] = $data;
        $research->forceFill(['student_drafts' => $drafts])->save();

        return $research->refresh();
    }

    public function applyToView(Research $research, User $user): Research
    {
        $data = $this->forStudent($research, $user);
        if ($data === null) {
            return $research;
        }

        foreach (['research_title', 'research_adviser', 'program_id', 'completed_month', 'completed_year', 'research_abstract', 'research_manuscript'] as $field) {
            if (array_key_exists($field, $data)) {
                $research->{$field} = $data[$field];
            }
        }

        $research->setRelation('researchers', collect($data['researchers'] ?? $research->researchers->toArray())->map(fn (array $item) => new Researcher($item)));
        if (array_key_exists('keywords', $data)) {
            $research->setRelation('keywords', collect($data['keywords'])->map(fn ($name) => new \App\Models\Keyword(['keyword_name' => $name])));
        }
        return $research;
    }

    public function promote(Research $research, User $user): void
    {
        $data = $this->forStudent($research, $user);
        if ($data === null) {
            return;
        }

        $research->fill(array_intersect_key($data, array_flip([
            'research_title', 'research_adviser', 'program_id', 'completed_month',
            'completed_year', 'research_abstract', 'research_manuscript',
        ])));
        $research->save();

        if (array_key_exists('keywords', $data)) {
            $research->keywords()->sync(collect($data['keywords'])->map(fn ($name) => \App\Models\Keyword::firstOrCreate(['keyword_name' => $name])->id)->all());
        }
        foreach (['panelists', 'agendas', 'sdgs', 'srigs'] as $relation) {
            if (array_key_exists($relation, $data)) {
                $research->{$relation}()->sync($data[$relation]);
            }
        }

        foreach ($data['researchers'] ?? [] as $item) {
            if (! empty($item['id'])) {
                $research->researchers()->whereKey($item['id'])->update([
                    'first_name' => $item['first_name'] ?? '',
                    'middle_name' => $item['middle_name'] ?? null,
                    'last_name' => $item['last_name'] ?? '',
                    'is_lead_author' => (bool) ($item['is_lead_author'] ?? false),
                ]);
            }
        }

        $drafts = $research->student_drafts ?? [];
        unset($drafts[(string) $user->id]);
        $research->forceFill(['student_drafts' => $drafts ?: null])->save();
    }

    public function forStudent(Research $research, User $user): ?array
    {
        if (! $user->isStudent() || ! $research->researchers()->where('user_id', $user->id)->exists()) {
            return null;
        }

        return $research->student_drafts[(string) $user->id] ?? null;
    }
}