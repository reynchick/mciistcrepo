<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\UserAuditLog;

class StoreUserAuditLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdministrator();
    }

    public function rules(): array
    {
        return [
            'modified_by' => ['nullable', 'exists:users,id'],
            'target_user_id' => ['nullable', 'exists:users,id'],
            'action_type' => ['required', Rule::in(UserAuditLog::allowedActions())],
            'old_values' => ['nullable', 'array'],
            'new_values' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
            'ip_address' => ['nullable', 'string', 'max:45'],
            'user_agent' => ['nullable', 'string'],
        ];
    }
}