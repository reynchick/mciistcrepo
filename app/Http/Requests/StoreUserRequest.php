<?php


namespace App\Http\Requests;


use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use App\Models\User;


class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdministrator();
    }


    public function rules(): array
    {
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
                Rule::unique('users', 'email')->whereNull('deleted_at'),
                'regex:/^[^@]+@usep\\.edu\\.ph$/'
            ],
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['required', 'exists:roles,id'],
        ];

        if ($isFaculty) {
            $rules['faculty_id'] = [
                'required', 'string', 'max:255', Rule::unique('users', 'faculty_id')->whereNull('deleted_at'),
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
            $rules['student_id'] = ['required', 'string', 'max:255', Rule::unique('users', 'student_id')->whereNull('deleted_at')];
            $rules['faculty_id'] = ['nullable'];
        } else {
            $rules['student_id'] = ['nullable'];
            $rules['faculty_id'] = ['nullable'];
        }

        return $rules;
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $roleIds = collect($this->input('role_ids', []))->map(fn ($roleId) => (int) $roleId);
            $facultyRoleId = (int) $this->getFacultyRoleId();
            $studentRoleId = (int) $this->getStudentRoleId();

            if ($facultyRoleId && $studentRoleId && $roleIds->contains($facultyRoleId) && $roleIds->contains($studentRoleId)) {
                $validator->errors()->add('role_ids', 'A user cannot have both Faculty and Student roles.');
            }

            $email = strtolower((string) $this->input('email'));
            $facultyId = $this->input('faculty_id');
            $studentId = $this->input('student_id');

            // If a soft-deleted user already owns this email, prompt restore instead of creating a duplicate
            $trashedByEmail = User::withTrashed()->where('email', $email)->first();
            if ($trashedByEmail && $trashedByEmail->trashed()) {
                $validator->errors()->add('email', 'This email belongs to a deleted user. Please restore that account instead of creating a new one.');
                // Also surface on faculty_id/student_id if they match the trashed account so the user sees all conflicts
                if ($facultyId && $trashedByEmail->faculty_id === $facultyId) {
                    $validator->errors()->add('faculty_id', 'This faculty ID belongs to a deleted user. Please restore that account instead of reusing the ID.');
                }
                if ($studentId && $trashedByEmail->student_id === $studentId) {
                    $validator->errors()->add('student_id', 'This student ID belongs to a deleted user. Please restore that account instead of reusing the ID.');
                }
            }

            // Same idea for faculty_id and student_id to avoid reusing IDs from soft-deleted accounts
            if ($facultyId) {
                $trashedFaculty = User::withTrashed()->where('faculty_id', $facultyId)->first();
                if ($trashedFaculty && $trashedFaculty->trashed()) {
                    $validator->errors()->add('faculty_id', 'This faculty ID belongs to a deleted user. Please restore that account instead of reusing the ID.');
                }
            }

            if ($studentId) {
                $trashedStudent = User::withTrashed()->where('student_id', $studentId)->first();
                if ($trashedStudent && $trashedStudent->trashed()) {
                    $validator->errors()->add('student_id', 'This student ID belongs to a deleted user. Please restore that account instead of reusing the ID.');
                }
            }
        });
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