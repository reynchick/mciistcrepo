<?php

namespace App\Support;

final class SensitiveDataRedactor
{
    /**
     * Removes credential-bearing fields before audit data is persisted or returned.
     * Browser-facing payloads must additionally use explicit allow-lists.
     */
    public static function redact(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        $redacted = [];

        foreach ($values as $key => $value) {
            if (self::isSensitiveKey((string) $key)) {
                continue;
            }

            $redacted[$key] = is_array($value) ? self::redact($value) : $value;
        }

        return $redacted;
    }

    private static function isSensitiveKey(string $key): bool
    {
        return (bool) preg_match('/(?:^|_)(?:password|remember_token|google_id|token|secret|session|api_key|authorization|credential)(?:_|$)/i', $key);
    }
}
