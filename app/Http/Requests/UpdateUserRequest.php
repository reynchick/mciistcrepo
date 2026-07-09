<?php


namespace App\Http\Requests;


use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdministrator();
    }


    public function rules(): array
    {
        $userId = $this->route('user');
        $facultyRoleId = $this->getFacultyRoleId();
        $studentRoleId = $this->getStudentRoleId();
        $roles = $this->input('role_ids', []);
        $isFaculty = in_array($facultyRoleId, $roles);
        $isStudent = in_array($studentRoleId, $roles);

        $rules = [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'email' => [
                'bail',
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($userId),
                'regex:/^[^@]+@usep\\.edu\\.ph$/'
            ],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['required', 'exists:roles,id'],
        ];

        if ($isFaculty) {
            $rules['faculty_id'] = [
                'required', 'string', 'max:255', Rule::unique('users', 'faculty_id')->ignore($userId),
                function ($attribute, $value, $fail) {
                    $faculty = \App\Models\Faculty::whereRaw('LOWER(email) = ?', [strtolower($this->input('email'))])->first();
                    if (!$faculty) {
                        $fail('The email must match an existing faculty record.');
                    } elseif ($faculty->faculty_id !== $value) {
                        $fail('The faculty ID must match the faculty record for this email.');
                    }
                }
            ];
            $rules['student_id'] = ['nullable'];
        } elseif ($isStudent) {
            $rules['student_id'] = ['required', 'string', 'max:255', Rule::unique('users', 'student_id')->ignore($userId)];
            $rules['faculty_id'] = ['nullable'];
        } else {
            $rules['student_id'] = ['nullable'];
            $rules['faculty_id'] = ['nullable'];
        }

        return $rules;
    }

    protected function getFacultyRoleId()
    {
        return \App\Models\Role::where('name', 'Faculty')->value('id');
    }

    protected function getStudentRoleId()
    {
        return \App\Models\Role::where('name', 'Student')->value('id');
    }


    public function messages(): array
    {
        return [
            'email.regex' => 'Email must be a valid USeP email address ending with @usep.edu.ph',
            'role_ids.required' => 'At least one role must be selected.',
            'role_ids.*.exists' => 'One or more selected roles do not exist.',
        ];
    }


    protected function prepareForValidation(): void
    {
        foreach (['first_name', 'middle_name', 'last_name', 'contact_number', 'student_id', 'faculty_id'] as $field) {
            if ($this->has($field)) {
                $value = trim((string) $this->input($field));
                // Convert empty strings to null for student_id and faculty_id (they have UNIQUE constraints)
                if (in_array($field, ['student_id', 'faculty_id']) && $value === '') {
                    $this->merge([$field => null]);
                } else {
                    $this->merge([$field => $value]);
                }
            }
        }
        if ($this->has('email')) {
            $this->merge(['email' => strtolower(trim((string) $this->input('email')))]);
        }
    }
}