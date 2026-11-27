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
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'position' => ['sometimes', 'nullable', 'string', 'max:255'],
            'designation' => ['sometimes', 'nullable', 'string', 'max:255'],
            'orcid' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'educational_attainment' => ['sometimes', 'nullable', 'string', 'max:255'],
            'field_of_specialization' => ['sometimes', 'nullable', 'string'],
            'research_interest' => ['sometimes', 'nullable', 'string'],
            'faculty_id' => ['prohibited'],
            'email' => ['prohibited'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.image' => 'The file must be an image.',
            'photo.mimes' => 'The photo must be a JPG or PNG file.',
            'photo.max' => 'The photo must not be larger than 2MB.',
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