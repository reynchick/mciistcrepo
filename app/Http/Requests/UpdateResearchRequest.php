<?php

namespace App\Http\Requests;

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

        return [
            'research_title' => [
                'bail',
                'required',
                'string',
                'max:255',
                Rule::unique('researches', 'research_title')->ignore($researchId)
            ],
            'research_adviser' => ['nullable', 'exists:faculties,id'],
            'program_id' => ['required', 'exists:programs,id'],
            'published_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'published_year' => ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'research_abstract' => ['required', 'string'],
            'research_approval_sheet' => ['nullable', 'file', 'image', 'max:2048'],
            'research_manuscript' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'keywords' => ['required', 'array', 'min:1'],
            'keywords.*' => ['string', 'max:60'],
            'archive_reason' => ['nullable', 'string', 'required_with:archived_at'],

            'researchers' => ['required', 'array', 'min:1'],
            'researchers.*.id' => ['nullable', 'exists:researchers,id'],
            'researchers.*.first_name' => ['required', 'string', 'max:255'],
            'researchers.*.middle_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.last_name' => ['required', 'string', 'max:255'],
            'researchers.*.email' => [
                'nullable',
                'bail',
                'email',
                'regex:/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/',
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
    }

    public function messages(): array
    {
        return [
            'research_title.unique' => 'This research title already exists in the repository.',
            'researchers.*.email.regex' => 'The researcher email must be a valid USeP email (name@usep.edu.ph).',
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
            $seen = [];
            foreach ((array) $this->input('researchers', []) as $index => $researcher) {
                $email = strtolower(trim((string) ($researcher['email'] ?? '')));
                if ($email === '') {
                    continue;
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
        });
    }

    protected function prepareForValidation(): void
    {
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
