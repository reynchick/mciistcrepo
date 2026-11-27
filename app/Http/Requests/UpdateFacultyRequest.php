<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFacultyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Administrative record management stays on this route. Faculty
        // self-editing uses updateOwnProfile(), which resolves the target
        // from the authenticated user's faculty relationship.
        return $this->user()->isActingAs('Administrator');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $facultyId = $this->route('faculty');

        return [
            'faculty_id' => ['sometimes', 'bail', 'required', 'string', 'max:255', Rule::unique('faculties', 'faculty_id')->ignore($facultyId)],
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'position' => ['sometimes', 'nullable', 'string', 'max:255'],
            'designation' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'nullable',
                'bail',
                'email',
                Rule::unique('faculties', 'email')->ignore($facultyId),
                'regex:/^[^@]+@usep\.edu\.ph$/'
            ],
            'orcid' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'educational_attainment' => ['sometimes', 'nullable', 'string', 'max:255'],
            'field_of_specialization' => ['sometimes', 'nullable', 'string'],
            'research_interest' => ['sometimes', 'nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'faculty_id.required' => 'Faculty ID is required.',
            'faculty_id.unique' => 'This Faculty ID is already taken.',
            'email.email' => 'Email must be a valid email address.',
            'email.unique' => 'This email is already registered.',
            'email.regex' => 'Email must be a USeP email ending with @usep.edu.ph',
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
        if ($this->has('email')) {
            $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
        }
    }
}