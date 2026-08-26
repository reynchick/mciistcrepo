<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOwnFacultyProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isActingAs('Faculty')
            && $this->user()->faculty()->exists();
    }

    public function rules(): array
    {
        // This endpoint intentionally has no faculty_id or email inputs.  Its
        // target is resolved exclusively from the authenticated user's link.
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'designation' => ['nullable', 'string', 'max:255'],
            'orcid' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'educational_attainment' => ['nullable', 'string', 'max:255'],
            'field_of_specialization' => ['nullable', 'string'],
            'research_interest' => ['nullable', 'string'],
            'faculty_id' => ['prohibited'],
            'email' => ['prohibited'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['first_name', 'middle_name', 'last_name', 'position', 'designation', 'educational_attainment'] as $field) {
            if ($this->has($field)) {
                $this->merge([$field => trim((string) $this->input($field))]);
            }
        }
    }
}
