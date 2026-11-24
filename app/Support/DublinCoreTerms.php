<?php

namespace App\Support;

final class DublinCoreTerms
{
    private const SOURCE_CORE = 'core';

    private const SOURCE_CATALOG = 'catalog';

    private const SOURCES = [
        'title' => self::SOURCE_CORE,
        'creator' => self::SOURCE_CORE,
        'subject' => self::SOURCE_CATALOG,
        'description' => self::SOURCE_CATALOG,
        'publisher' => self::SOURCE_CATALOG,
        'contributor' => self::SOURCE_CATALOG,
        'date' => self::SOURCE_CORE,
        'type' => self::SOURCE_CATALOG,
        'format' => self::SOURCE_CATALOG,
        'identifier' => self::SOURCE_CATALOG,
        'source' => self::SOURCE_CATALOG,
        'language' => self::SOURCE_CATALOG,
        'relation' => self::SOURCE_CATALOG,
        'coverage' => self::SOURCE_CATALOG,
        'rights' => self::SOURCE_CATALOG,
    ];

    public static function supported(): array
    {
        return array_keys(self::SOURCES);
    }

    public static function stored(): array
    {
        return array_keys(array_filter(
            self::SOURCES,
            fn (string $source): bool => $source === self::SOURCE_CATALOG,
        ));
    }

    public static function derived(): array
    {
        return array_keys(array_filter(
            self::SOURCES,
            fn (string $source): bool => $source === self::SOURCE_CORE,
        ));
    }

    public static function isSupported(string $term): bool
    {
        return array_key_exists($term, self::SOURCES);
    }

    public static function isDerived(string $term): bool
    {
        return (self::SOURCES[$term] ?? null) === self::SOURCE_CORE;
    }
}
