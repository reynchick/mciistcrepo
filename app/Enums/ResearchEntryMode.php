<?php

namespace App\Enums;

use App\Support\ResearchStatusConfig;

enum ResearchEntryMode: string
{
    case FACULTY_STUDENT = 'faculty_student';
    case FACULTY_ONLY = 'faculty_only';
    case GUEST = 'guest';

    public function label(): string
    {
        return ResearchStatusConfig::entryModeLabel($this->value);
    }

    public static function fromValue(?string $value): self
    {
        foreach (self::cases() as $case) {
            if ($case->value === $value) {
                return $case;
            }
        }

        return self::FACULTY_STUDENT;
    }
}
