<?php

namespace App\Http\Requests\Concerns;

use App\Models\Researcher;
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

    protected function validateLeadAuthorCount(Validator $validator): void
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
    }

    /**
     * Validate researcher email uniqueness within the request and database.
     *
     * @param  array<int, int|string>  $skipIndexes
     */
    protected function validateResearcherEmailUniqueness(
        Validator $validator,
        bool $ignoreSubmittedResearcherIds = false,
        array $skipIndexes = [],
    ): void {
        $seen = [];

        foreach ((array) $this->input('researchers', []) as $index => $researcher) {
            if (! is_array($researcher) || in_array($index, $skipIndexes, true)) {
                continue;
            }

            $email = strtolower(trim((string) ($researcher['email'] ?? '')));
            if ($email === '') {
                continue;
            }

            if (isset($seen[$email])) {
                $validator->errors()->add(
                    "researchers.$index.email",
                    'This email is already used by another researcher in this list.'
                );

                continue;
            }

            $seen[$email] = true;
            $query = Researcher::query()->where('email', $email);

            if ($ignoreSubmittedResearcherIds && ! empty($researcher['id'])) {
                $query->where('id', '!=', $researcher['id']);
            }

            if ($query->exists()) {
                $validator->errors()->add(
                    "researchers.$index.email",
                    'This email is already used by another researcher.'
                );
            }
        }
    }
}
