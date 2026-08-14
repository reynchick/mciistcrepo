<?php

namespace App\Services;

use App\Models\Research;
use InvalidArgumentException;

class PostingReadinessService
{
    public function ensureReady(Research $research): void
    {
        $missing = [];

        foreach (config('research.publish_requirements', []) as $field) {
            if (blank($research->{$field})) {
                $missing[] = $field;
            }
        }

        if (! empty($missing)) {
            throw new InvalidArgumentException('Research cannot be posted until these fields are provided: ' . implode(', ', $missing));
        }
    }

    public function missingRequirements(Research $research): array
    {
        return array_filter(array_map(fn ($field) => blank($research->{$field}) ? $field : null, config('research.publish_requirements', [])));
    }
}
