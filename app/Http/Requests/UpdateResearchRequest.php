<?php

namespace App\Http\Requests;

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
        $invitationAction = (string) $this->input('invitation_action', 'save_only');
        $workflowAction = (string) $this->input('workflow_action', 'draft');

        $rules = [
            'status' => ['nullable', 'string', 'in:draft,draft_invited,submitted,returned,posted,archived'],
            'updated_at' => ['nullable', 'string'],
            'invitation_action' => ['nullable', 'string', Rule::in(['save_only', 'send_invitations'])],
            'workflow_action' => ['nullable', 'string', Rule::in(['draft', 'invite', 'post'])],
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
            'research_approval_sheet' => ['nullable', 'file', 'mimes:pdf', 'max:2048'],
            'research_manuscript' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
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
        ];

        if ($invitationAction === 'send_invitations' && $workflowAction !== 'invite') {
            $rules['researchers'] = ['required', 'array', 'min:1'];
            $rules['researchers.*.first_name'] = ['required', 'string', 'max:255'];
            $rules['researchers.*.last_name'] = ['required', 'string', 'max:255'];
            $rules['researchers.*.email'] = ['required', 'bail', 'email'];
        }

        if ($status === 'posted') {
            $rules['research_adviser'] = ['required', 'exists:faculties,id'];
            $rules['completed_year'] = ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)];
            $rules['completed_month'] = ['required', 'integer', 'min:1', 'max:12'];
            $rules['research_abstract'] = ['required', 'string'];
            $rules['research_approval_sheet'] = ['required', 'file', 'mimes:pdf', 'max:2048'];
            $rules['research_manuscript'] = ['required', 'file', 'mimes:pdf', 'max:10240'];
            $rules['keywords'] = ['required', 'array', 'min:1'];
            $rules['researchers'] = ['required', 'array', 'min:1'];
            $rules['researchers.*.first_name'] = ['required', 'string', 'max:255'];
            $rules['researchers.*.last_name'] = ['required', 'string', 'max:255'];
            $rules['panelists'] = ['required', 'array', 'min:1'];
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
            $updatedAtInput = $this->input('updated_at');

            if ($research && $updatedAtInput !== null && $research->updated_at?->toJSON() !== $updatedAtInput) {
                $validator->errors()->add('updated_at', 'This research was modified by someone else. Please refresh and try again.');
            }

            $user = $this->user();
            if ($research && $user) {
                $status = $research->status?->value ?? $research->status;
                $isStaff = $user->isAdministrator() || $user->isMCIISStaff();
                $isOwnResearch = $user->isFaculty() && $user->faculty && $research->research_adviser === $user->faculty->id;
                $isLinkedStudent = $user->isStudent() && $research->researchers()->where('user_id', $user->id)->exists();

                $canEdit = false;

                if ($isStaff) {
                    $canEdit = $status !== 'archived';
                } elseif ($isOwnResearch) {
                    $canEdit = in_array($status, ['draft', 'draft_invited', 'submitted', 'returned'], true);
                } elseif ($isLinkedStudent && $research->isStudentCollaborationEnabled()) {
                    $canEdit = in_array($status, ['draft_invited', 'returned'], true);
                }

                if (! $canEdit) {
                    $validator->errors()->add('research', 'This research cannot be edited in its current workflow state.');
                }

                if ($isLinkedStudent) {
                    if ((int) $this->input('program_id', $research->program_id) !== (int) $research->program_id) {
                        $validator->errors()->add('program_id', 'Students cannot change the program for this research.');
                    }

                    if ((int) $this->input('research_adviser', $research->research_adviser) !== (int) $research->research_adviser) {
                        $validator->errors()->add('research_adviser', 'Students cannot change the adviser for this research.');
                    }

                    if ($this->has('researchers')) {
                        $existingById = $research->researchers()->get()->keyBy('id');
                        $submittedResearchers = collect((array) $this->input('researchers', []))
                            ->keyBy(fn ($researcher) => isset($researcher['id']) && $researcher['id'] !== '' ? (int) $researcher['id'] : null)
                            ->filter(fn ($researcher, $id) => $id !== null)
                            ->all();

                        $blocked = false;

                        foreach ($existingById as $existingId => $existingResearcher) {
                            $submitted = $submittedResearchers[$existingId] ?? null;

                            if ($submitted === null) {
                                $blocked = true;
                                break;
                            }

                            $isOwnResearcher = (int) $existingResearcher->user_id === (int) $user->id;
                            $submittedFirstName = trim((string) ($submitted['first_name'] ?? ''));
                            $submittedMiddleName = trim((string) ($submitted['middle_name'] ?? ''));
                            $submittedLastName = trim((string) ($submitted['last_name'] ?? ''));
                            $submittedEmail = strtolower(trim((string) ($submitted['email'] ?? '')));
                            $existingFirstName = trim((string) ($existingResearcher->first_name));
                            $existingMiddleName = trim((string) ($existingResearcher->middle_name ?? ''));
                            $existingLastName = trim((string) ($existingResearcher->last_name));
                            $existingEmail = strtolower(trim((string) ($existingResearcher->email ?? '')));
                            $nameChanged = $submittedFirstName !== $existingFirstName
                                || $submittedMiddleName !== $existingMiddleName
                                || $submittedLastName !== $existingLastName;
                            $emailChanged = $submittedEmail !== $existingEmail;
                            $leadChanged = (bool) ($submitted['is_lead_author'] ?? false) !== (bool) $existingResearcher->is_lead_author;

                            if (! $isOwnResearcher) {
                                if ($nameChanged || $emailChanged || $leadChanged) {
                                    $blocked = true;
                                    break;
                                }

                                continue;
                            }

                            if ($emailChanged) {
                                $blocked = true;
                                break;
                            }

                            if ($nameChanged || $leadChanged) {
                                continue;
                            }
                        }

                        if ($blocked || count($submittedResearchers) !== $existingById->count()) {
                            $validator->errors()->add('researchers', 'Students may only update their own name and the lead author designation on this research.');
                        }
                    }
                }
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

            if ($leadAuthors > 1) {
                $validator->errors()->add('researchers', 'Only one lead author is allowed.');
            }

            if ($this->input('workflow_action') === 'invite') {
                $hasCompleteResearcher = collect((array) $this->input('researchers', []))
                    ->contains(fn ($researcher) => filled($researcher['first_name'] ?? null)
                        && filled($researcher['last_name'] ?? null)
                        && filled($researcher['email'] ?? null));

                if (! $hasCompleteResearcher) {
                    $validator->errors()->add('researchers', 'At least one researcher must have a first name, last name, and email address.');
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
