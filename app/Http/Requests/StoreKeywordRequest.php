<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreKeywordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->isMCIISStaff() || $this->user()->isFaculty();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'keyword_name' => ['bail', 'required', 'string', 'max:255', 'unique:keywords,keyword_name'],
        ];
    }

    public function messages(): array
    {
        return [
            'keyword_name.required' => 'Keyword name is required.',
            'keyword_name.unique' => 'This keyword already exists.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('keyword_name')) {
            $this->merge(['keyword_name' => trim((string) $this->input('keyword_name'))]);
        }
    }
}
