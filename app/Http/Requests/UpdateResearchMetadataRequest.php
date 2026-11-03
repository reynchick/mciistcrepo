<?php

namespace App\Http\Requests;

use App\Models\ResearchMetadataValue;
use Illuminate\Foundation\Http\FormRequest;

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
            'metadata.*.term' => ['required', 'string', 'in:'.implode(',', ResearchMetadataValue::TERMS)],
            'metadata.*.value' => ['required', 'string', 'max:10000'],
            'metadata.*.scheme' => ['nullable', 'string', 'max:255'],
            'metadata.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'creator_ids' => ['array'],
            'creator_ids.*' => ['integer', 'distinct'],
            'physical_attributes' => ['array'],
            'physical_attributes.hardboundLocation' => ['nullable', 'string', 'max:255'],
            'physical_attributes.physicalAvailability' => ['required', 'boolean'],
        ];
    }
}
