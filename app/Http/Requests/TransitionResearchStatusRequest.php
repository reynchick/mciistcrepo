<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransitionResearchStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('changeStatus', $this->route('research')) ?? false;
    }

    public function rules(): array
    {
        $rules = [
            'status' => ['required', 'string', 'in:draft,submitted,published,returned,archived'],
            'note' => ['nullable', 'string', 'max:1000'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];

        if ($this->input('status') === 'returned') {
            $rules['note'] = ['required', 'string', 'max:1000'];
        }

        if ($this->input('status') === 'archived') {
            $rules['reason'] = ['required', 'string', 'max:1000'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'status.in' => 'The selected status is invalid.',
        ];
    }
}
