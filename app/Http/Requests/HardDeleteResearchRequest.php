<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HardDeleteResearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        $research = $this->route('research');

        if (! $research) {
            return false;
        }

        return $this->user()?->can('hardDelete', $research) ?? false;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:1000'],
            'confirmation' => ['required', 'string', 'in:DELETE'],
        ];
    }
}
