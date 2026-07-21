<?php

namespace App\Http\Requests;

use App\Enums\ResearchEntryMode;
use App\Enums\ResearchStatus;
use App\Models\Researcher;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreResearchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $adviserId = $this->input('research_adviser');
        return $this->user()->can('create', [\App\Models\Research::class, $adviserId]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $status = $this->input('status', 'draft');
        $isFacultyStudent = $this->input('entry_mode') === ResearchEntryMode::FACULTY_STUDENT->value;

        $rules = [
            'status' => ['nullable', 'string', 'in:draft,published'],
            'entry_mode' => ['nullable', 'string', 'in:faculty_student,faculty_only,guest,staff_direct_publish'],
            'research_title' => [
                'bail',
                'required',
                'string',
                'max:255',
                Rule::unique('researches', 'research_title')
                    ->where('status', '!=', ResearchStatus::ARCHIVED->value)
            ],
            'uploaded_by' => ['required', 'exists:users,id'],
            'research_adviser' => ['nullable', 'exists:faculties,id'],
            'program_id' => ['required', 'exists:programs,id'],
            'published_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'research_abstract' => ['required', 'string'],
            'research_approval_sheet' => ['nullable', 'file', 'mimes:pdf', 'max:2048'],
            'research_manuscript' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'keywords' => ['required', 'array', 'min:1'],
            'keywords.*' => ['string', 'max:60'],
            'researchers' => ['required', 'array', 'min:1'],
            'researchers.*.first_name' => ['required', 'string', 'max:255'],
            'researchers.*.middle_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.last_name' => ['required', 'string', 'max:255'],
            'researchers.*.is_lead_author' => ['nullable', 'boolean'],
            'researchers.*.email' => [
                Rule::requiredIf($isFacultyStudent),
                'nullable',
                'bail',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/',
            ],

            'panelists' => ['nullable', 'array'],
            'panelists.*' => ['distinct', 'integer', 'exists:faculties,id'],

            // Optional tagging relationships
            'agendas' => ['nullable', 'array'],
            'agendas.*' => ['distinct', 'exists:agendas,id'],
            'sdgs' => ['nullable', 'array'],
            'sdgs.*' => ['distinct', 'exists:sdgs,id'],
            'srigs' => ['nullable', 'array'],
            'srigs.*' => ['distinct', 'exists:srigs,id'],
        ];

        if ($status === 'published') {
            $rules['research_adviser'] = ['required', 'exists:faculties,id'];
            $rules['published_year'] = ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)];
            $rules['research_manuscript'] = ['required', 'file', 'mimes:pdf', 'max:10240'];
        } else {
            $rules['published_year'] = ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)];
        }

        return $rules;
    }

    /**
     * Ensure each researcher's email is unique against the database and
     * against duplicates within this same submission.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $entryMode = $this->input('entry_mode');
            $seen = [];
            $leadAuthors = 0;
            foreach ((array) $this->input('researchers', []) as $index => $researcher) {
                if (!empty($researcher['is_lead_author'])) {
                    $leadAuthors++;
                }
                $email = strtolower(trim((string) ($researcher['email'] ?? '')));
                if ($entryMode === ResearchEntryMode::FACULTY_STUDENT->value && $email === '') {
                    $validator->errors()->add("researchers.$index.email", 'A researcher email is required for faculty/student entries.');
                    continue;
                }
                if ($email === '') {
                    continue;
                }
                if (isset($seen[$email])) {
                    $validator->errors()->add("researchers.$index.email", 'This email is already used by another researcher in this list.');
                    continue;
                }
                $seen[$email] = true;

                if (Researcher::where('email', $email)->exists()) {
                    $validator->errors()->add("researchers.$index.email", 'This email is already used by another researcher.');
                }
            }

            if ($leadAuthors !== 1) {
                $validator->errors()->add('researchers', 'Please select exactly one lead author.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'research_title.unique' => 'This research title already exists in the repository.',
            'uploaded_by.required' => 'Uploader is required.',
            'uploaded_by.exists' => 'Uploader user does not exist.',
            'research_approval_sheet.mimes' => 'Only PDF files are allowed for the approval sheet.',
            'research_manuscript.mimes' => 'Only PDF files are allowed for the manuscript.',
            'researchers.*.email.regex' => 'The researcher email must be a valid USeP email (name@usep.edu.ph).',
            'keywords.*.exists' => 'One or more selected keywords do not exist.',
            'agendas.*.exists' => 'One or more selected agendas do not exist.',
            'sdgs.*.exists' => 'One or more selected SDGs do not exist.',
            'srigs.*.exists' => 'One or more selected SRIGs do not exist.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (!$this->filled('uploaded_by') && $this->user()) {
            $this->merge(['uploaded_by' => $this->user()->id]);
        }

        if ($this->has('entry_mode') && $this->filled('entry_mode')) {
            $this->merge(['entry_mode' => trim((string) $this->input('entry_mode'))]);
        } else {
            $this->merge(['entry_mode' => ResearchEntryMode::FACULTY_STUDENT->value]);
        }

        if ($this->has('research_title')) {
            $this->merge(['research_title' => trim((string) $this->input('research_title'))]);
        }
        if ($this->has('research_abstract')) {
            $this->merge(['research_abstract' => trim((string) $this->input('research_abstract'))]);
        }
        if ($this->has('researchers') && is_array($this->researchers)) {
            $normalized = array_map(function ($r) {
                if (isset($r['email'])) {
                    $r['email'] = strtolower(trim((string) $r['email']));
                }
                foreach (['first_name', 'middle_name', 'last_name'] as $f) {
                    if (isset($r[$f])) {
                        $r[$f] = trim((string) $r[$f]);
                    }
                }
                return $r;
            }, $this->researchers);
            $this->merge(['researchers' => $normalized]);
        }
    }
}
