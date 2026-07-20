<?php

namespace App\Http\Actions\Research;

use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use Illuminate\Support\Arr;
use InvalidArgumentException;

abstract class ResearchWorkflowAction
{
    protected function applyStatusChange(
        Research $research,
        User $user,
        string $actionType,
        array $attributes,
        array $metadata = []
    ): bool {
        $oldValues = $research->getAttributes();

        $result = Research::withoutEvents(function () use ($research, $attributes): bool {
            $research->forceFill($attributes);

            return $research->save();
        });

        if (! $result) {
            return false;
        }

        $research->refresh();

        $this->logResearchChange($research, $user, $actionType, $oldValues, $research->getAttributes(), $metadata);

        return true;
    }

    protected function logResearchChange(
        Research $research,
        User $user,
        string $actionType,
        ?array $oldValues,
        ?array $newValues,
        array $metadata = []
    ): void {
        ResearchEntryLog::create([
            'modified_by' => $user->id,
            'target_research_id' => $research->id,
            'action_type' => $actionType,
            'old_values' => $oldValues ? Arr::only($oldValues, ['status', 'published_at', 'archived_at', 'archived_by', 'archive_reason', 'submitted_at']) : null,
            'new_values' => $newValues ? Arr::only($newValues, ['status', 'published_at', 'archived_at', 'archived_by', 'archive_reason', 'submitted_at']) : null,
            'metadata' => $metadata,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }

    protected function requireNote(?string $note, string $message = 'A note is required.'): void
    {
        if (blank($note)) {
            throw new InvalidArgumentException($message);
        }
    }

    protected function requireReason(?string $reason, string $message = 'A reason is required.'): void
    {
        if (blank($reason)) {
            throw new InvalidArgumentException($message);
        }
    }

    protected function validatePublishRequirements(Research $research): void
    {
        $missing = [];

        foreach (config('research.publish_requirements', []) as $field) {
            if (blank($research->{$field})) {
                $missing[] = $field;
            }
        }

        if ($missing !== []) {
            throw new InvalidArgumentException('Research cannot be published until these fields are provided: '.implode(', ', $missing));
        }
    }

    protected function ensureUniqueTitle(Research $research): void
    {
        $exists = Research::query()
            ->where('research_title', $research->research_title)
            ->where('id', '!=', $research->id)
            ->whereNull('archived_at')
            ->exists();

        if ($exists) {
            throw new InvalidArgumentException('A research item with this title already exists.');
        }
    }

    protected function assertStaffAccess(User $user): void
    {
        if (! ($user->isAdministrator() || $user->isMCIISStaff())) {
            throw new InvalidArgumentException('Only staff or administrators can perform this action.');
        }
    }

    protected function assertAdminAccess(User $user): void
    {
        if (! $user->isAdministrator()) {
            throw new InvalidArgumentException('Only administrators can perform this action.');
        }
    }

    protected function rebuildStatus(Research $research, string $status): array
    {
        return [
            'status' => ResearchStatus::fromValue($status),
            'submitted_at' => $research->submitted_at,
            'published_at' => $research->published_at,
            'archived_at' => $research->archived_at,
            'archived_by' => $research->archived_by,
            'archive_reason' => $research->archive_reason,
        ];
    }
}
