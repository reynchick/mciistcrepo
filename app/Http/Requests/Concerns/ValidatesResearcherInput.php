<?php

namespace App\Http\Requests\Concerns;

use Illuminate\Validation\Validator;

trait ValidatesResearcherInput
{
    protected function normalizeResearchers(): void
    {
        if ($this->has('researchers') && is_array($this->researchers)) {
            $normalized = array_map(function ($researcher) {
                if (isset($researcher['email'])) {
                    $researcher['email'] = strtolower(trim((string) $researcher['email']));
                }

                foreach (['first_name', 'middle_name', 'last_name'] as $field) {
                    if (isset($researcher[$field])) {
                        $researcher[$field] = trim((string) $researcher[$field]);
                    }
                }

                return $researcher;
            }, $this->researchers);

            $this->merge(['researchers' => $normalized]);
        }
    }

    protected function validateResearcherSubmission(Validator $validator): void
    {
        $researchers = (array) $this->input('researchers', []);
        $leadAuthors = 0;

        foreach ($researchers as $researcher) {
            if (! empty($researcher['is_lead_author'])) {
                $leadAuthors++;
            }
        }

        if ($leadAuthors > 1) {
            $validator->errors()->add('researchers', 'Only one lead author is allowed.');
        }

        if ($this->input('workflow_action') !== 'invite') {
            return;
        }

        $hasCompleteResearcher = collect($researchers)
            ->contains(fn ($researcher) => filled($researcher['first_name'] ?? null)
                && filled($researcher['last_name'] ?? null)
                && filled($researcher['email'] ?? null));

        if (! $hasCompleteResearcher) {
            $validator->errors()->add(
                'researchers',
                'At least one researcher must have a first name, last name, and email address.'
            );
        }
    }
}
