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
            if (blank($research->{$field})) {
                $missing[] = $field;
            }
        }

        if (blank($research->research_approval_sheet)) {
            $missing[] = 'research_approval_sheet';
        }

        if (blank($research->completed_month)) {
            $missing[] = 'completed_month';
        }

        $researchers = $research->researchers()->get(['first_name', 'last_name', 'email']);
        if ($researchers->isEmpty() || $researchers->contains(fn ($researcher) => blank($researcher->first_name)
            || blank($researcher->last_name)
            || blank($researcher->email))) {
            $missing[] = 'researchers';
        }

        if ($research->panelists()->count() < 1) {
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
