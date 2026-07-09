<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompiledReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->isAdminOrStaff();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'report_type_id' => ['bail', 'required', 'exists:report_types,id'],
            'report_format_id' => ['bail', 'required', 'exists:report_formats,id'],
            'generated_on' => ['required', 'date'],
            'filters_applied' => ['nullable', 'json'],
            'file_path' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'report_type_id.required' => 'Report type is required.',
            'report_type_id.exists' => 'Selected report type does not exist.',
            'report_format_id.required' => 'Report format is required.',
            'report_format_id.exists' => 'Selected report format does not exist.',
            'generated_on.required' => 'Generated timestamp is required.',
            'generated_on.date' => 'Generated timestamp must be a valid date.',
            'filters_applied.json' => 'Filters must be valid JSON.',
            'file_path.required' => 'Generated file path is required.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('filters_applied') && is_array($this->filters_applied)) {
            $this->merge(['filters_applied' => json_encode($this->filters_applied)]);
        }
    }
}
