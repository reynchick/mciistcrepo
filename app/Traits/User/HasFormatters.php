<?php

namespace App\Traits\User;

trait HasFormatters
{
    public function getFormattedContactNumberAttribute(): ?string
    {
        if (!$this->contact_number) {
            return null;
        }

        $clean = preg_replace('/[^0-9]/', '', $this->contact_number);

        if (strlen($clean) === 11 && substr($clean, 0, 2) === '09') {
            return '+63 ' . substr($clean, 1);
        }

        if (strlen($clean) === 12 && substr($clean, 0, 2) === '63') {
            return '+63 ' . substr($clean, 2);
        }

        return $this->contact_number;
    }

    public function getFormattedStudentIdAttribute(): ?string
    {
        if (!$this->student_id) {
            return null;
        }

        $clean = preg_replace('/[^0-9]/', '', $this->student_id);

        if (strlen($clean) >= 8) {
            $year = substr($clean, 0, 4);
            $number = substr($clean, 4);
            return $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
        }

        return $this->student_id;
    }
}
