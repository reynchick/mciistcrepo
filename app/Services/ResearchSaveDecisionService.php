<?php

namespace App\Services;

use App\Enums\ResearchStatus;
use App\Models\Keyword;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\Researcher;
use App\Models\User;
use App\Services\ResearchMailService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ResearchSaveDecisionService
{
    public function __construct(
        protected ResearchMailService $mailService,
    ) {
    }

    public function summarize(Research $research, array $payload): array
    {
        if (! array_key_exists('researchers', $payload)) {
            return [
                'added' => [],
                'changed_emails' => [],
                'removed' => [],
                'expired' => [],
                'archive_revoked' => [],
            ];
        }

        $existingResearchers = $research->researchers()->with('invitations')->get()->keyBy('id');
        $submittedResearchers = collect($payload['researchers'] ?? [])->map(fn ($item) => $this->normalizeResearcherPayload($item));

        $summary = [
            'added' => [],
            'changed_emails' => [],
            'removed' => [],
            'expired' => [],
            'archive_revoked' => [],
        ];

        $keepIds = [];

        foreach ($submittedResearchers as $researcherData) {
            if ($researcherData['id'] === null) {
                $summary['added'][] = [
                    'researcher_id' => null,
                    'name' => $this->formatResearcherName($researcherData),
                    'email' => $researcherData['email'],
                ];
                continue;
            }

            $existing = $existingResearchers->get($researcherData['id']);
            if (! $existing) {
                $summary['added'][] = [
                    'researcher_id' => null,
                    'name' => $this->formatResearcherName($researcherData),
                    'email' => $researcherData['email'],
                ];
                continue;
            }

            $keepIds[] = $existing->id;

            if ($this->isEmailChanged($existing->email, $researcherData['email'])) {
                $summary['changed_emails'][] = [
                    'researcher_id' => $existing->id,
                    'name' => $this->formatResearcherName($researcherData),
                    'old_email' => $existing->email,
                    'new_email' => $researcherData['email'],
                ];
            }

            if ($existing->hasExpiredUnacceptedInvitation()) {
                $summary['expired'][] = [
                    'researcher_id' => $existing->id,
                    'name' => $existing->fullName,
                    'email' => $existing->email,
                ];
            }

            if ($existing->hasAcceptedInvitationHistory() && ! $existing->hasCurrentAccess()) {
                $summary['archive_revoked'][] = [
                    'researcher_id' => $existing->id,
                    'name' => $existing->fullName,
                    'email' => $existing->email,
                ];
            }
        }

        foreach ($existingResearchers->whereNotIn('id', $keepIds) as $removedResearcher) {
            $summary['removed'][] = [
                'researcher_id' => $removedResearcher->id,
                'name' => $removedResearcher->fullName,
                'had_access' => $removedResearcher->hasCurrentAccess(),
            ];
        }

        return $summary;
    }

    public function requiresDecision(array $summary): bool
    {
        return ! empty($summary['added'])
            || ! empty($summary['changed_emails'])
            || ! empty($summary['expired'])
            || ! empty($summary['archive_revoked'])
            || ! empty($summary['removed']);
    }

    public function isRemovalOnly(array $summary): bool
    {
        return ! empty($summary['removed'])
            && empty($summary['added'])
            && empty($summary['changed_emails'])
            && empty($summary['expired'])
            && empty($summary['archive_revoked']);
    }

    public function commit(
        Research $research,
        array $payload,
        ?string $expectedUpdatedAt,
        $user
    ): array {
        return DB::transaction(function () use ($research, $payload, $expectedUpdatedAt, $user) {
            $research = Research::query()->whereKey($research->id)->lockForUpdate()->firstOrFail();

            if ($expectedUpdatedAt !== null && $research->updated_at?->toJSON() !== $expectedUpdatedAt) {
                throw ValidationException::withMessages([
                    'updated_at' => 'This research was modified by someone else. Please refresh and try again.',
                ]);
            }

            $summary = $this->summarize($research, $payload);

            $oldResearchValues = $research->getOriginal();
            $this->applyResearchUpdates($research, $payload);
            $research->save();

            if (array_key_exists('keywords', $payload)) $this->syncKeywords($research, $payload['keywords']);
            if (array_key_exists('panelists', $payload)) $this->syncPanelists($research, $payload['panelists']);
            if (array_key_exists('agendas', $payload)) $this->syncAgendas($research, $payload['agendas']);
            if (array_key_exists('sdgs', $payload)) $this->syncSdgs($research, $payload['sdgs']);
            if (array_key_exists('srigs', $payload)) $this->syncSrigs($research, $payload['srigs']);

            if (array_key_exists('researchers', $payload)) {
                $this->syncResearchers($research, $payload['researchers'], false);
            }

            ResearchEntryLog::create([
                'modified_by' => $user->id,
                'target_research_id' => $research->id,
                'action_type' => ResearchEntryLog::ACTION_UPDATE,
                'old_values' => Arr::only($oldResearchValues, ['status', 'posted_at', 'archived_at', 'archived_by', 'archive_reason', 'submitted_at']),
                'new_values' => Arr::only($research->getAttributes(), ['status', 'posted_at', 'archived_at', 'archived_by', 'archive_reason', 'submitted_at']),
                'metadata' => [
                    'summary' => $summary,
                ],
                'ip_address' => request()?->ip(),
                'user_agent' => request()?->userAgent(),
            ]);

            return [
                'summary' => $summary,
                'research' => $research->refresh(),
                'invitation_emails_queued' => 0,
            ];
        });
    }

    protected function normalizeResearcherPayload(array $researcher): array
    {
        return [
            'id' => isset($researcher['id']) && $researcher['id'] !== '' ? (int) $researcher['id'] : null,
            'first_name' => trim((string) ($researcher['first_name'] ?? '')),
            'middle_name' => isset($researcher['middle_name']) ? trim((string) $researcher['middle_name']) : null,
            'last_name' => trim((string) ($researcher['last_name'] ?? '')),
            'email' => $this->normalizeEmail($researcher['email'] ?? null),
            'is_lead_author' => isset($researcher['is_lead_author']) ? (bool) $researcher['is_lead_author'] : false,
        ];
    }

    protected function normalizeEmail(?string $email): ?string
    {
        $email = trim((string) $email);
        return $email === '' ? null : strtolower($email);
    }

    protected function formatResearcherName(array $researcher): string
    {
        return collect([$researcher['first_name'], $researcher['middle_name'], $researcher['last_name']])
            ->filter()
            ->join(' ');
    }

    protected function isEmailChanged(?string $existingEmail, ?string $submittedEmail): bool
    {
        $existingEmail = $existingEmail ? strtolower(trim($existingEmail)) : null;
        $submittedEmail = $submittedEmail ? strtolower(trim($submittedEmail)) : null;

        return $existingEmail !== $submittedEmail;
    }

    protected function applyResearchUpdates(Research $research, array $payload): void
    {
        $attributes = Arr::only($payload, [
            'research_title',
            'research_adviser',
            'program_id',
            'completed_month',
            'completed_year',
            'research_abstract',
        ]);

        $research->fill($attributes);
    }

    protected function syncKeywords(Research $research, array $keywords): void
    {
        $keywordIds = collect($keywords)
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->map(fn ($name) => Keyword::firstOrCreate(['keyword_name' => $name])->id)
            ->unique()
            ->values()
            ->all();

        $research->keywords()->sync($keywordIds);
    }

    protected function syncPanelists(Research $research, array $panelists): void
    {
        $research->panelists()->sync(array_values(array_filter($panelists, fn ($id) => is_numeric($id))));
    }

    protected function syncAgendas(Research $research, array $agendas): void
    {
        $research->agendas()->sync(array_values(array_filter($agendas, fn ($id) => is_numeric($id))));
    }

    protected function syncSdgs(Research $research, array $sdgs): void
    {
        $research->sdgs()->sync(array_values(array_filter($sdgs, fn ($id) => is_numeric($id))));
    }

    protected function syncSrigs(Research $research, array $srigs): void
    {
        $research->srigs()->sync(array_values(array_filter($srigs, fn ($id) => is_numeric($id))));
    }

    protected function syncResearchers(Research $research, array $researchers): array
    {
        $existingResearchers = $research->researchers()->with('invitations')->get()->keyBy('id');
        $submittedResearchers = collect($researchers)->map(fn ($item) => $this->normalizeResearcherPayload($item));

        $keepIds = [];

        foreach ($submittedResearchers as $researcherData) {
            $matchedStudentId = $this->studentIdForEmail($researcherData['email']);

            if ($researcherData['id'] === null || ! $existingResearchers->has($researcherData['id'])) {
                $created = $research->researchers()->create([
                    'first_name' => $researcherData['first_name'],
                    'middle_name' => $researcherData['middle_name'],
                    'last_name' => $researcherData['last_name'],
                    'email' => $researcherData['email'],
                    'is_lead_author' => $researcherData['is_lead_author'],
                    'user_id' => $matchedStudentId,
                ]);

                $keepIds[] = $created->id;
                continue;
            }

            $researcher = $existingResearchers->get($researcherData['id']);
            $emailChanged = $this->isEmailChanged($researcher->email, $researcherData['email']);

            if ($emailChanged) {
                $researcher->revokePendingInvitations();
                $researcher->forceFill(['user_id' => null])->save();
            }

            $researcher->forceFill([
                'first_name' => $researcherData['first_name'],
                'middle_name' => $researcherData['middle_name'],
                'last_name' => $researcherData['last_name'],
                'email' => $researcherData['email'],
                'is_lead_author' => $researcherData['is_lead_author'],
                'user_id' => $matchedStudentId,
            ])->save();

            $keepIds[] = $researcher->id;
        }

        $removedResearchers = $research->researchers()->whereNotIn('id', $keepIds)->get();
        foreach ($removedResearchers as $removedResearcher) {
            $removedResearcher->revokePendingInvitations();
            $removedResearcher->forceFill(['user_id' => null])->save();
            $removedResearcher->delete();
        }

        return [];
    }

    protected function studentIdForEmail(?string $email): ?int
    {
        $normalizedEmail = strtolower(trim((string) $email));

        if ($normalizedEmail === '') {
            return null;
        }

        return User::query()
            ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
            ->whereHas('roles', fn ($query) => $query->where('name', 'Student'))
            ->value('id');
    }

}
