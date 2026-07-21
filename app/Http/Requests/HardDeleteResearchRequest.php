<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HardDeleteResearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('hardDelete', $this->route('research')) ?? false;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
