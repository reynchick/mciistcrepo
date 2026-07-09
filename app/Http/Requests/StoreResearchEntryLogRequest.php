<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\ResearchEntryLog;

class StoreResearchEntryLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isMCIISStaff() || $this->user()->isFaculty();
    }

    public function rules(): array
    {
        return [
            'modified_by' => ['nullable', 'exists:users,id'],
            'target_research_id' => ['nullable', 'exists:research,id'],
            'action_type' => ['required', Rule::in(array_keys(ResearchEntryLog::getActionTypes()))],
            'old_values' => ['nullable', 'array'],
            'new_values' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'ip_address' => ['nullable', 'string', 'max:45'],
            'user_agent' => ['nullable', 'string'],
        ];
    }
}