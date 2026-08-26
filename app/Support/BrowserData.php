<?php

namespace App\Support;

use App\Models\CompiledReport;
use App\Models\FacultyAuditLog;
use App\Models\KeywordSearchLog;
use App\Models\Research;
use App\Models\ResearchAccessLog;
use App\Models\ResearchEntryLog;
use App\Models\User;
use App\Models\UserAuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

final class BrowserData
{
    public static function user(User $user): array
    {
        return [
            'id' => $user->id,
            'student_id' => $user->student_id,
            'faculty_id' => $user->faculty_id,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'last_name' => $user->last_name,
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
            'avatar' => $user->avatar,
            'faculty_profile_completed' => $user->faculty_profile_completed,
            'student_profile_completed' => $user->student_profile_completed,
            'first_login_completed' => $user->first_login_completed,
            'created_by_admin' => $user->created_by_admin,
            'deleted_at' => $user->deleted_at,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
            'roles' => $user->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
            ])->values()->all(),
        ];
    }

    public static function identity(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => trim(implode(' ', array_filter([$user->first_name, $user->middle_name, $user->last_name]))),
        ];
    }

    public static function userAudit(UserAuditLog $log): array
    {
        return [
            'id' => $log->id,
            'action_type' => $log->action_type,
            'created_at' => $log->created_at,
            'modified_by' => self::identity($log->modifiedBy),
            'old_values' => self::changes($log->old_values, self::userAuditFields()),
            'new_values' => self::changes($log->new_values, self::userAuditFields()),
            'metadata' => self::metadata($log->metadata),
        ];
    }

    public static function log(Model $log, bool $includeChanges = false): array
    {
        $base = [
            'id' => $log->id,
            'action_type' => $log->action_type ?? null,
            'created_at' => $log->created_at,
        ];

        if ($log instanceof UserAuditLog) {
            $base += [
                'target_user_id' => $log->target_user_id,
                'modified_by' => $log->modified_by,
                'targetUser' => self::identity($log->targetUser),
                'modifiedByUser' => self::identity($log->modifiedByUser),
            ];
            return self::withChanges($base, $log, self::userAuditFields(), $includeChanges);
        }

        if ($log instanceof FacultyAuditLog) {
            $base += [
                'target_faculty_id' => $log->target_faculty_id,
                'modified_by' => $log->modified_by,
                'targetFaculty' => $log->targetFaculty ? [
                    'id' => $log->targetFaculty->id,
                    'full_name' => $log->targetFaculty->full_name,
                ] : null,
                'modifiedByUser' => self::identity($log->modifiedByUser),
            ];
            return self::withChanges($base, $log, ['first_name', 'middle_name', 'last_name', 'position', 'designation', 'email', 'orcid', 'contact_number', 'educational_attainment', 'field_of_specialization', 'research_interest'], $includeChanges);
        }

        if ($log instanceof ResearchEntryLog) {
            $base += [
                'target_research_id' => $log->target_research_id,
                'modified_by' => $log->modified_by,
                'targetResearch' => $log->targetResearch ? [
                    'id' => $log->targetResearch->id,
                    'title' => $log->targetResearch->research_title,
                    'completed_year' => $log->targetResearch->completed_year,
                    'researchers' => $log->targetResearch->researchers->map(fn ($researcher) => [
                        'id' => $researcher->id,
                        'first_name' => $researcher->first_name,
                        'middle_name' => $researcher->middle_name,
                        'last_name' => $researcher->last_name,
                    ])->all(),
                ] : null,
                'modifiedByUser' => self::identity($log->modifiedByUser),
            ];
            return self::withChanges($base, $log, ['research_title', 'research_adviser', 'program_id', 'completed_month', 'completed_year', 'status', 'submitted_at', 'posted_at', 'archived_at', 'archive_reason'], $includeChanges);
        }

        if ($log instanceof ResearchAccessLog) {
            return $base + [
                'research_id' => $log->research_id,
                'user_id' => $log->user_id,
                'research' => $log->research ? ['id' => $log->research->id, 'title' => $log->research->research_title, 'completed_year' => $log->research->completed_year] : null,
                'user' => self::identity($log->user),
            ];
        }

        if ($log instanceof KeywordSearchLog) {
            return $base + [
                'keyword_id' => $log->keyword_id,
                'user_id' => $log->user_id,
                'search_term' => $log->search_term,
                'keyword' => $log->keyword ? ['id' => $log->keyword->id, 'keyword_name' => $log->keyword->keyword_name] : null,
                'user' => self::identity($log->user),
            ];
        }

        if ($log instanceof CompiledReport) {
            return $base + [
                'report_type_id' => $log->report_type_id,
                'report_format_id' => $log->report_format_id,
                'generated_by' => $log->generated_by,
                'generated_on' => $log->generated_on,
                'report_type_name' => $log->reportType?->name,
                'report_format_name' => $log->reportFormat?->name,
                'generatedBy' => self::identity($log->generatedBy),
                'generated_by_name' => self::identity($log->generatedBy)['full_name'] ?? null,
                'file_exists' => (bool) ($log->file_exists ?? false),
            ];
        }

        return $base;
    }

    public static function publicResearch(Research $research): array
    {
        return [
            'id' => $research->id,
            'research_title' => $research->research_title,
            'research_abstract' => $research->research_abstract,
            'completed_year' => $research->completed_year,
            'completed_month' => $research->completed_month,
            'program' => $research->program ? ['id' => $research->program->id, 'name' => $research->program->name] : null,
            'adviser' => $research->adviser ? ['id' => $research->adviser->id, 'first_name' => $research->adviser->first_name, 'middle_name' => $research->adviser->middle_name, 'last_name' => $research->adviser->last_name] : null,
            'researchers' => $research->researchers->map(fn ($researcher) => [
                'id' => $researcher->id,
                'first_name' => $researcher->first_name,
                'middle_name' => $researcher->middle_name,
                'last_name' => $researcher->last_name,
            ])->values()->all(),
            'keywords' => $research->keywords->map(fn ($keyword) => ['id' => $keyword->id, 'keyword_name' => $keyword->keyword_name])->values()->all(),
        ];
    }

    public static function draftResearch(Research $research): array
    {
        return [
            'id' => $research->id,
            'research_title' => $research->research_title,
            'status' => $research->status?->value ?? $research->status,
            'updated_at' => $research->updated_at,
        ];
    }

    private static function withChanges(array $base, Model $log, array $fields, bool $includeChanges): array
    {
        if (! $includeChanges) {
            return $base;
        }

        return $base + [
            'old_values' => self::changes($log->old_values, $fields),
            'new_values' => self::changes($log->new_values, $fields),
            'metadata' => self::metadata($log->metadata),
        ];
    }

    private static function changes(?array $values, array $fields): ?array
    {
        return SensitiveDataRedactor::redact(Arr::only($values ?? [], $fields));
    }

    private static function metadata(?array $metadata): array
    {
        return Arr::only(SensitiveDataRedactor::redact($metadata) ?? [], ['source', 'context', 'note', 'changed', 'added_roles', 'removed_roles', 'roles_added', 'roles_removed']);
    }

    private static function userAuditFields(): array
    {
        return ['first_name', 'middle_name', 'last_name', 'email', 'contact_number', 'student_id', 'faculty_id', 'faculty_profile_completed', 'student_profile_completed', 'first_login_completed', 'email_verified_at', 'created_by_admin', 'deleted_at'];
    }
}
