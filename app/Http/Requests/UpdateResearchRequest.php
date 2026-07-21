<?php

namespace App\Http\Requests;

use App\Enums\ResearchEntryMode;
use App\Enums\ResearchStatus;
use App\Models\Researcher;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateResearchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $research = $this->route('research');
        return $this->user()->can('update', $research);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $researchId = $this->route('research');
        $status = $this->input('status', $this->route('research')?->status ?? 'draft');
        $isFacultyStudent = $this->input('entry_mode', $this->route('research')?->entry_mode?->value ?? 'faculty_student') === ResearchEntryMode::FACULTY_STUDENT->value;

        $rules = [
            'status' => ['nullable', 'string', 'in:draft,submitted,published,returned,archived'],
            'entry_mode' => ['nullable', 'string', 'in:faculty_student,faculty_only,guest'],
            'updated_at' => ['nullable', 'string'],
            'research_title' => [
                'bail',
                'required',
                'string',
                'max:255',
                Rule::unique('researches', 'research_title')
                    ->where('status', '!=', ResearchStatus::ARCHIVED->value)
                    ->ignore($researchId)
            ],
            'research_adviser' => ['nullable', 'exists:faculties,id'],
            'program_id' => ['required', 'exists:programs,id'],
            'published_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'research_abstract' => ['required', 'string'],
            'research_approval_sheet' => ['nullable', 'file', 'mimes:pdf', 'max:2048'],
            'research_manuscript' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'keywords' => ['required', 'array', 'min:1'],
            'keywords.*' => ['string', 'max:60'],
            'archive_reason' => ['nullable', 'string', 'required_with:archived_at'],

            'researchers' => ['required', 'array', 'min:1'],
            'researchers.*.id' => ['nullable', 'exists:researchers,id'],
            'researchers.*.first_name' => ['required', 'string', 'max:255'],
            'researchers.*.middle_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.last_name' => ['required', 'string', 'max:255'],
            'researchers.*.is_lead_author' => ['nullable', 'boolean'],
            // The USeP-domain policy is enforced in withValidator() so that
            // unchanged emails on existing researchers are grandfathered.
            'researchers.*.email' => [
                Rule::requiredIf($isFacultyStudent),
                'nullable',
                'bail',
                'email',
            ],

            'panelists' => ['nullable', 'array'],
            'panelists.*' => ['distinct', 'integer', 'exists:faculties,id'],

            // Optional tagging updates
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

    public function messages(): array
    {
        return [
            'research_title.unique' => 'This research title already exists in the repository.',
            'research_approval_sheet.mimes' => 'Only PDF files are allowed for the approval sheet.',
            'research_manuscript.mimes' => 'Only PDF files are allowed for the manuscript.',
            'panelists.*.exists' => 'One or more selected panelists do not exist.',
            'agendas.*.exists' => 'One or more selected agendas do not exist.',
            'sdgs.*.exists' => 'One or more selected SDGs do not exist.',
            'srigs.*.exists' => 'One or more selected SRIGs do not exist.',
        ];
    }

    /**
     * Ensure each researcher's email is unique (excluding itself when editing
     * an existing researcher, and excluding duplicates within the submission).
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $research = $this->route('research');
            $isFacultyStudent = $this->input('entry_mode', $research?->entry_mode?->value ?? 'faculty_student') === ResearchEntryMode::FACULTY_STUDENT->value;
            $updatedAtInput = $this->input('updated_at');

            if ($research && $updatedAtInput !== null && $research->updated_at?->toJSON() !== $updatedAtInput) {
                $validator->errors()->add('updated_at', 'This research was modified by someone else. Please refresh and try again.');
            }

            $user = $this->user();
            if ($research && $user) {
                $status = $research->status?->value ?? $research->status;
                $isStaff = $user->isAdministrator() || $user->isMCIISStaff();
                $isOwnResearch = $user->isFaculty() && $user->faculty && $research->research_adviser === $user->faculty->id;
                $canEdit = $isStaff || ($isOwnResearch && in_array($status, ['draft', 'returned'], true));

                if (! $canEdit) {
                    $validator->errors()->add('research', 'This research cannot be edited in its current workflow state.');
                }
            }

            $seen = [];
            $leadAuthors = 0;
            foreach ((array) $this->input('researchers', []) as $index => $researcher) {
                if (!empty($researcher['is_lead_author'])) {
                    $leadAuthors++;
                }
                $email = strtolower(trim((string) ($researcher['email'] ?? '')));
                if ($isFacultyStudent && $email === '') {
                    $validator->errors()->add("researchers.$index.email", 'A researcher email is required for faculty/student entries.');
                    continue;
                }
                if ($email === '') {
                    continue;
                }

                // Enforce the USeP domain only for new researchers or changed
                // addresses; an unchanged email on an existing researcher is
                // grandfathered so legacy records stay editable.
                if (!preg_match('/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/', $email)) {
                    $storedEmail = !empty($researcher['id'])
                        ? strtolower(trim((string) Researcher::whereKey($researcher['id'])->value('email')))
                        : null;

                    if ($storedEmail !== $email) {
                        $validator->errors()->add("researchers.$index.email", 'The researcher email must be a valid USeP email (name@usep.edu.ph).');
                        continue;
                    }
                }
                if (isset($seen[$email])) {
                    $validator->errors()->add("researchers.$index.email", 'This email is already used by another researcher in this list.');
                    continue;
                }
                $seen[$email] = true;

                $exists = Researcher::where('email', $email)
                    ->when(!empty($researcher['id']), fn ($q) => $q->where('id', '!=', $researcher['id']))
                    ->exists();

                if ($exists) {
                    $validator->errors()->add("researchers.$index.email", 'This email is already used by another researcher.');
                }
            }

            if ($leadAuthors !== 1) {
                $validator->errors()->add('researchers', 'Please select exactly one lead author.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('entry_mode') && $this->filled('entry_mode')) {
            $this->merge(['entry_mode' => trim((string) $this->input('entry_mode'))]);
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
