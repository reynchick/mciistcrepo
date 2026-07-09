<?php

namespace App\Traits;

trait NormalizesEmail
{
    public function setEmailAttribute($value): void
    {
        $this->attributes['email'] = $value ? strtolower(trim((string) $value)) : null;
    }
}