<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreResearcherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $researchId = $this->input('research_id');
        $research = $researchId ? \App\Models\Research::find($researchId) : null;
        
        return $this->user()->can('create', [\App\Models\Researcher::class, $research]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'research_id' => ['required', 'exists:research,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable', 
                'bail',
                'email',
                'unique:researchers,email',
                'regex:/^[^@]+@usep\.edu\.ph$/'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'research_id.exists' => 'Selected research does not exist.',
            'email.regex' => 'Email must be a USeP email ending with @usep.edu.ph'
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['first_name', 'middle_name', 'last_name'] as $field) {
            if ($this->has($field)) {
                $this->merge([$field => trim((string) $this->input($field))]);
            }
        }
        if ($this->has('email')) {
            $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
        }
    }
}
