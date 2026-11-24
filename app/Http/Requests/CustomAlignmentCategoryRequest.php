<?php

namespace App\Http\Requests;

use App\Models\CustomAlignmentCategory;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates creating and renaming a custom alignment category.
 */
class CustomAlignmentCategoryRequest extends FormRequest
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
            'name' => ['bail', 'required', 'string', 'max:100', $this->notReserved('name'), $this->uniqueName()],
            'label' => ['nullable', 'string', 'max:30', $this->notReserved('label')],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Category name is required.',
            'name.max' => 'Category name may not be longer than 100 characters.',
            'label.max' => 'Short label may not be longer than 30 characters.',
            'description.max' => 'Description may not be longer than 1000 characters.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(collect(['name', 'label', 'description'])
            ->filter(fn (string $field): bool => $this->has($field))
            ->mapWithKeys(function (string $field): array {
                $value = trim((string) $this->input($field));

                return [$field => $value === '' && $field !== 'name' ? null : $value];
            })
            ->all());
    }

    private function notReserved(string $field): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) use ($field): void {
            if (in_array(mb_strtolower((string) $value), CustomAlignmentCategory::RESERVED_NAMES, true)) {
                $what = $field === 'name' ? 'name' : 'short label';
                $fail("\"{$value}\" is a built-in category. Choose a different {$what}; SDG, SRIG, and Agenda already exist.");
            }
        };
    }

    /**
     * Case-insensitive uniqueness that behaves the same on SQLite and MySQL.
     */
    private function uniqueName(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $current = $this->route('customCategory');

            $exists = CustomAlignmentCategory::query()
                ->whereRaw('LOWER(name) = ?', [mb_strtolower((string) $value)])
                ->when($current instanceof CustomAlignmentCategory, fn ($query) => $query->whereKeyNot($current->getKey()))
                ->exists();

            if ($exists) {
                $fail('A category with this name already exists.');
            }
        };
    }
}
