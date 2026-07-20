<?php

namespace App\Enums;

use App\Support\ResearchStatusConfig;

enum ResearchStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case PUBLISHED = 'published';
    case RETURNED = 'returned';
    case ARCHIVED = 'archived';

    public function label(?string $context = null): string
    {
        return ResearchStatusConfig::statusLabel($this->value, $context);
    }

    public function badgeColor(): string
    {
        return ResearchStatusConfig::badgeColor($this->value);
    }

    public function isPublic(): bool
    {
        return (bool) (ResearchStatusConfig::statuses()[$this->value]['public'] ?? false);
    }

    public static function fromValue(?string $value): self
    {
        foreach (self::cases() as $case) {
            if ($case->value === $value) {
                return $case;
            }
        }

        return self::DRAFT;
    }
}
