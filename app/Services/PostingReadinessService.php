<?php

namespace App\Services;

use App\Models\Research;
use InvalidArgumentException;

class PostingReadinessService
{
    public function ensureReady(Research $research): void
    {
        $missing = $this->missingRequirements($research);

        if (! empty($missing)) {
            throw new InvalidArgumentException('Research cannot be posted until these fields are provided: ' . implode(', ', $missing));
        }
    }

    public function missingRequirements(Research $research): array
    {
        $missing = [];

        foreach (config('research.post_requirements', []) as $field) {
            if ($field === 'research_manuscript' && $research->manuscript_unavailable_legacy_at) {
                continue;
            }
            if (blank($research->{$field})) {
                $missing[] = $field;
            }
        }

        if (blank($research->completed_month)) {
            $missing[] = 'completed_month';
        }

        // Researcher emails are required to invite collaborators, not to post
        // a completed research record.
        $researchers = $research->researchers()->get(['first_name', 'last_name']);
        if ($researchers->isEmpty() || $researchers->contains(fn ($researcher) => blank($researcher->first_name)
            || blank($researcher->last_name))) {
            $missing[] = 'researchers';
        }

        if ($research->panelists()->count() < 1 && ! $research->panelists_unavailable_legacy_at) {
            $missing[] = 'panelists';
        }

        if ($research->keywords()->count() < 1) {
            $missing[] = 'keywords';
        }

        if ($research->agendas()->count() < 1) {
            $missing[] = 'agendas';
        }

        if ($research->sdgs()->count() < 1) {
            $missing[] = 'sdgs';
        }

        if ($research->srigs()->count() < 1) {
            $missing[] = 'srigs';
        }

        return array_values(array_unique($missing));
    }
}
