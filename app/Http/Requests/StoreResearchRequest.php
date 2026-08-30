<?php

namespace App\Http\Requests;

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
        $workflowAction = (string) $this->input('workflow_action', 'draft');

        $rules = [
            'status' => ['nullable', 'string', 'in:draft,submitted,returned,posted,archived'],
            'workflow_action' => ['required', 'string', Rule::in(['draft', 'post'])],
            'research_title' => [
                'bail',
                'required',
                'string',
                'max:255',
                Rule::unique('researches', 'research_title')
                    ->where('status', '!=', ResearchStatus::ARCHIVED->value)
            ],
            'uploaded_by' => ['nullable', 'exists:users,id'],
            'research_adviser' => ['nullable', 'exists:faculties,id'],
            'program_id' => ['required', 'exists:programs,id'],
            'completed_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'completed_year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'research_abstract' => ['nullable', 'string'],
            'research_manuscript' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'panelists_unavailable' => ['nullable', 'boolean'],
            'manuscript_unavailable' => ['nullable', 'boolean'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string', 'max:60'],
            'researchers' => ['nullable', 'array'],
            'researchers.*.first_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.middle_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.last_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.is_lead_author' => ['nullable', 'boolean'],
            'researchers.*.email' => [
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

        if ($workflowAction === 'invite') {
            $rules['researchers'] = ['required', 'array', 'min:1'];
            $rules['researchers.*.first_name'] = ['nullable', 'string', 'max:255'];
            $rules['researchers.*.last_name'] = ['nullable', 'string', 'max:255'];
            $rules['researchers.*.email'] = [
                'nullable',
                'bail',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/',
            ];
        }

        if ($workflowAction === 'post') {
            $rules['research_adviser'] = ['required', 'exists:faculties,id'];
            $rules['completed_year'] = ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)];
            $rules['completed_month'] = ['required', 'integer', 'min:1', 'max:12'];
            $rules['research_abstract'] = ['required', 'string'];
            $rules['research_manuscript'] = $this->boolean('manuscript_unavailable')
                ? ['nullable', 'file', 'mimes:pdf', 'max:10240']
                : ['required', 'file', 'mimes:pdf', 'max:10240'];
            $rules['keywords'] = ['required', 'array', 'min:1'];
            $rules['researchers'] = ['required', 'array', 'min:1'];
            $rules['researchers.*.first_name'] = ['required', 'string', 'max:255'];
            $rules['researchers.*.last_name'] = ['required', 'string', 'max:255'];
            $rules['researchers.*.email'] = ['nullable', 'bail', 'email', 'regex:/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/'];
            $rules['panelists'] = $this->boolean('panelists_unavailable')
                ? ['nullable', 'array']
                : ['required', 'array', 'min:1'];
            $rules['agendas'] = ['required', 'array', 'min:1'];
            $rules['sdgs'] = ['required', 'array', 'min:1'];
            $rules['srigs'] = ['required', 'array', 'min:1'];
        }

        return $rules;
    }

    /**
     * Ensure each researcher's email is unique against the database and
     * against duplicates within this same submission.
     */
    public function withValidator(Validator $validator): void
    {
        $workflowAction = (string) $this->input('workflow_action', 'draft');

        $validator->after(function (Validator $validator) use ($workflowAction) {
            if (($this->boolean('panelists_unavailable') || $this->boolean('manuscript_unavailable'))
                && ! $this->user()?->isMCIISStaff()) {
                $validator->errors()->add('unavailable', 'Only MCIIS Staff can mark research information as unavailable.');
            }
            $seen = [];
            $leadAuthors = 0;
            foreach ((array) $this->input('researchers', []) as $index => $researcher) {
                if (!empty($researcher['is_lead_author'])) {
                    $leadAuthors++;
                }
                $email = strtolower(trim((string) ($researcher['email'] ?? '')));
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

            if ($leadAuthors > 1) {
                $validator->errors()->add('researchers', 'Only one lead author is allowed.');
            }

            if ($workflowAction === 'invite') {
                $hasCompleteResearcher = collect((array) $this->input('researchers', []))
                    ->contains(fn ($researcher) => filled($researcher['first_name'] ?? null)
                        && filled($researcher['last_name'] ?? null)
                        && filled($researcher['email'] ?? null));

                if (! $hasCompleteResearcher) {
                    $validator->errors()->add(
                        'researchers',
                        'At least one researcher must have a first name, last name, and email address.'
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'research_title.unique' => 'This research title already exists in the repository.',
            'uploaded_by.required' => 'Uploader is required.',
            'uploaded_by.exists' => 'Uploader user does not exist.',
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
        if (!$this->filled('workflow_action')) {
            $this->merge(['workflow_action' => 'draft']);
        }

        if (!$this->filled('uploaded_by') && $this->user()) {
            $this->merge(['uploaded_by' => $this->user()->id]);
        }

        if ($this->has('research_title')) {
            $this->merge(['research_title' => trim((string) $this->input('research_title'))]);
        }
        if ($this->has('research_abstract')) {
            $this->merge(['research_abstract' => trim((string) $this->input('research_abstract'))]);
        }

        foreach (['research_adviser', 'completed_month', 'completed_year', 'research_abstract'] as $field) {
            if ($this->has($field) && blank($this->input($field))) {
                $this->merge([$field => null]);
            }
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
