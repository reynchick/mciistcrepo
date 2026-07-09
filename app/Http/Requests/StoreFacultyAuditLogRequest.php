<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\FacultyAuditLog;

class StoreFacultyAuditLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdministrator() || $this->user()->isFaculty();
    }

    public function rules(): array
    {
        return [
            'modified_by' => ['nullable', 'exists:users,id'],
            'target_faculty_id' => ['nullable', 'exists:faculties,id'],
            'action_type' => ['required', Rule::in(array_keys(FacultyAuditLog::getActionTypes()))],
            'old_values' => ['nullable', 'array'],
            'new_values' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'ip_address' => ['nullable', 'string', 'max:45'],
            'user_agent' => ['nullable', 'string'],
        ];
    }
}