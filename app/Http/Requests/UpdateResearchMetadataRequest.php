<?php

namespace App\Http\Requests;

use App\Support\DublinCoreTerms;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateResearchMetadataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewMetadata', $this->route('research')) ?? false;
    }

    public function rules(): array
    {
        return [
            'metadata' => ['array'],
            'metadata.*.term' => [
                'required',
                'string',
                Rule::in(DublinCoreTerms::stored()),
            ],
            'metadata.*.value' => ['required', 'string', 'max:10000'],
            'metadata.*.scheme' => ['nullable', 'string', 'max:255'],
            'metadata.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'hardbound_location' => ['nullable', 'string', 'max:255'],
            'physical_availability' => ['required', 'boolean'],
            'research_manuscript' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'clear_research_manuscript' => ['nullable', 'boolean'],
            'manuscript_unavailable' => ['required', 'boolean'],
        ];
    }
}
