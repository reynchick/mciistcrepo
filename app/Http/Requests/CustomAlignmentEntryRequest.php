<?php

namespace App\Http\Requests;

use App\Models\CustomAlignmentCategory;
use App\Models\CustomAlignmentEntry;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates creating and editing an entry inside a custom alignment category.
 */
class CustomAlignmentEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdministrator() ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['bail', 'required', 'string', 'max:255', $this->uniqueNameInCategory()],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Name / code is required.',
            'name.max' => 'Name / code may not be longer than 255 characters.',
            'description.max' => 'Description may not be longer than 1000 characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'description'] as $field) {
            if ($this->has($field)) {
                $value = trim((string) $this->input($field));
                $this->merge([$field => $value === '' && $field === 'description' ? null : $value]);
            }
        }
    }

    private function uniqueNameInCategory(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $category = $this->route('customCategory');
            $current = $this->route('entry');

            if (! $category instanceof CustomAlignmentCategory) {
                return;
            }

            $exists = $category->entries()
                ->whereRaw('LOWER(name) = ?', [mb_strtolower((string) $value)])
                ->when($current instanceof CustomAlignmentEntry, fn ($query) => $query->whereKeyNot($current->getKey()))
                ->exists();

            if ($exists) {
                $fail('An entry with this name / code already exists in this category.');
            }
        };
    }
}
