<?php

namespace App\Http\Requests;

use App\Enums\ResearchStatus;
use App\Http\Requests\Concerns\ValidatesResearcherInput;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateResearchRequest extends FormRequest
{
    use ValidatesResearcherInput;

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
        $workflowAction = (string) $this->input('workflow_action', 'draft');

        $rules = [
            'status' => ['nullable', 'string', 'in:draft,posted,archived'],
            'updated_at' => ['nullable', 'string'],
            'workflow_action' => ['nullable', 'string', Rule::in(['draft', 'post', 'staff_save'])],
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
            'completed_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'completed_year' => ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'research_abstract' => ['nullable', 'string'],
            'research_manuscript' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'clear_research_manuscript' => ['nullable', 'boolean'],
            'panelists_unavailable' => ['nullable', 'boolean'],
            'manuscript_unavailable' => ['nullable', 'boolean'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string', 'max:60'],
            'archive_reason' => ['nullable', 'string', 'required_with:archived_at'],

            'researchers' => ['nullable', 'array'],
            'researchers.*.id' => ['nullable', 'exists:researchers,id'],
            'researchers.*.first_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.middle_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.last_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.is_lead_author' => ['nullable', 'boolean'],
            // The USeP-domain policy is enforced in withValidator() so that
            // unchanged emails on existing researchers are grandfathered.
            'researchers.*.email' => [
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
            'alignment_entries' => ['nullable', 'array'],
            'alignment_entries.*' => ['array'],
            'alignment_entries.*.*' => ['integer', 'exists:research_alignment_entries,id'],
        ];

        // Posting is validated against the complete saved record immediately
        // afterwards.  Do not require re-uploading files just because a staff
        // member is editing an already-posted record.
        if ($workflowAction === 'post') {
            $rules['research_adviser'] = ['required', 'exists:faculties,id'];
            $rules['completed_year'] = ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)];
            $rules['completed_month'] = ['required', 'integer', 'min:1', 'max:12'];
            $rules['research_abstract'] = ['required', 'string'];
            // Existing stored files satisfy posting readiness; a staff member
            // should not have to upload them again when editing a posted item.
            $rules['research_manuscript'] = ['nullable', 'file', 'mimes:pdf', 'max:10240'];
            $rules['keywords'] = ['required', 'array', 'min:1'];
            $rules['researchers'] = ['required', 'array', 'min:1'];
            $rules['researchers.*.first_name'] = ['required', 'string', 'max:255'];
            $rules['researchers.*.last_name'] = ['required', 'string', 'max:255'];
            $rules['panelists'] = $this->boolean('panelists_unavailable')
                ? ['nullable', 'array']
                : ['required', 'array', 'min:1'];
            $rules['agendas'] = ['required', 'array', 'min:1'];
            $rules['sdgs'] = ['required', 'array', 'min:1'];
            $rules['srigs'] = ['required', 'array', 'min:1'];
        } else {
            $rules['completed_year'] = ['nullable', 'integer', 'min:1900', 'max:' . (date('Y') + 1)];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'research_title.unique' => 'This research title already exists in the repository.',
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
            $updatedAtInput = $this->input('updated_at');

            if ($research && $updatedAtInput !== null && $research->updated_at?->toJSON() !== $updatedAtInput) {
                $validator->errors()->add('updated_at', 'This research was modified by someone else. Please refresh and try again.');
            }

            $user = $this->user();
            if ($research && $user) {
                $status = $research->status?->value ?? $research->status;
                $isStaff = $user->isAdministrator() || $user->isMCIISStaff();
                $isOwnResearch = $user->isFaculty() && $user->faculty && $research->research_adviser === $user->faculty->id;

                $canEdit = false;

                if ($isStaff) {
                    $canEdit = $status !== 'archived';
                } elseif ($isOwnResearch) {
                    $canEdit = $status === 'draft';
                }

                if (! $canEdit) {
                    $validator->errors()->add('research', 'This research cannot be edited in its current workflow state.');
                }

                if (! $isStaff && ($this->boolean('panelists_unavailable') || $this->boolean('manuscript_unavailable'))) {
                    $validator->errors()->add('unavailable', 'Only MCIIS Staff can mark research information as unavailable.');
                }
            }

            $this->validateResearcherEmailUniqueness(
                $validator,
                ignoreSubmittedResearcherIds: true,
                allowUnchangedLegacyEmails: true,
            );
            $this->validateLeadAuthorCount($validator);

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

        $this->normalizeResearchers();
    }
}
