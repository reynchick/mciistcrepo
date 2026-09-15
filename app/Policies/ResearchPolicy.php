<?php


namespace App\Policies;


use App\Enums\ResearchStatus;
use App\Models\Research;
use App\Models\User;
use App\Support\ResearchAccessRules;
use Illuminate\Auth\Access\Response;


class ResearchPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }



    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, Research $research): bool
    {
        if ($research->status === ResearchStatus::POSTED) {
            return true;
        }

        if ($research->status === ResearchStatus::ARCHIVED) {
            return ResearchAccessRules::isStaffOrAdmin($user);
        }

        if (!$user) {
            return false;
        }

        if ($user->isStudent()) {
            return $research->researchers()
                ->where('user_id', $user->id)
                ->exists();
        }

        return $user->isAdministrator()
            || $user->isMCIISStaff()
            || ($user->isFaculty() && $user->faculty && $research->research_adviser === $user->faculty->id);
    }


    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, $adviserId = null): bool
    {
        // MCIIS Staff can create any research, including with an explicitly selected adviser.
        if ($user->isMCIISStaff()) {
            return true;
        }

        // Faculty can create research for their own faculty profile.
        // If an adviser was explicitly supplied, allow it; otherwise fall back to the
        // current faculty profile when the request is from a pure faculty upload.
        if ($user->isFaculty() && $user->faculty) {
            return $adviserId === null || (string) $adviserId === (string) $user->faculty->id;
        }

        return false;
    }


    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Research $research): bool
    {
        // Staff have elevated repository-management access, including the
        // ability to correct a posted entry before returning it to Draft.
        // Archived records remain immutable.
        if ($user->isMCIISStaff() || $user->isAdministrator()) {
            return $research->status !== ResearchStatus::ARCHIVED;
        }

        if ($research->status === ResearchStatus::POSTED || $research->status === ResearchStatus::ARCHIVED) {
            return false;
        }

        // Students cannot edit research (student collaboration removed)
        if ($user->isStudent()) {
            return false;
        }

        // A returned entry is with the linked student for private revision.
        // Faculty can review it but cannot alter it until it is resubmitted.
        if ($user->isFaculty() && $user->faculty) {
            $isAdviser = $research->research_adviser === $user->faculty->id;
            $isFacultyCreated = $research->uploadedBy?->isFaculty() ?? false;
            $isStaffCreated = $research->uploadedBy?->isMCIISStaff() ?? false;

            // An assigned adviser may complete a Staff-originated draft, but it
            // remains ineligible for the Faculty invitation workflow.
            return $isAdviser && ($isFacultyCreated || $isStaffCreated) && in_array($research->status?->value ?? $research->status, [
                ResearchStatus::DRAFT->value,
            ], true);
        }

        return false;
    }

    public function manageResearchers(User $user, Research $research): bool
    {
        if (ResearchAccessRules::isStaffOrAdmin($user)) {
            return true;
        }

        return ResearchAccessRules::canManageFacultyDraft($user, $research);
    }


    /**
     * Determine whether the user can assign researchers to research.
     */
    public function assignResearcher(User $user, Research $research): bool
    {
        if (ResearchAccessRules::isStaffOrAdmin($user)) {
            return true;
        }

        return ResearchAccessRules::canManageFacultyDraft($user, $research);
    }

    public function assignKeyword(User $user, Research $research): bool
    {
        if (ResearchAccessRules::isStaffOrAdmin($user)) {
            return true;
        }

        return ResearchAccessRules::canManageFacultyDraft($user, $research);
    }

    public function assignPanelist(User $user, Research $research): bool
    {
        if (ResearchAccessRules::isStaffOrAdmin($user)) {
            return true;
        }

        return ResearchAccessRules::canManageFacultyDraft($user, $research);
    }

    public function manageFiles(User $user, Research $research): bool
    {
        return ResearchAccessRules::canManageFiles($user, $research);
    }

    public function uploadFiles(User $user, Research $research): bool
    {
        return ResearchAccessRules::canManageFiles($user, $research);
    }

    public function viewDetails(User $user, Research $research): bool
    {
        return $this->view($user, $research);
    }

    public function downloadFiles(User $user, Research $research): bool
    {
        if (ResearchAccessRules::isStaffOrAdmin($user)) {
            return true;
        }

        if (ResearchAccessRules::isFacultyAdviser($user, $research)) {
            return true;
        }

        return $user->isStudent()
            && $research->researchers()->where('user_id', $user->id)->exists();
    }

    public function submit(User $user, Research $research): bool
    {
        return false;
    }

    public function returnForRevision(User $user, Research $research): bool
    {
        if (! in_array($research->status?->value ?? $research->status, [ResearchStatus::SUBMITTED->value], true)) {
            return false;
        }

        if ($user->isAdministrator() || $user->isMCIISStaff()) {
            return true;
        }

        return $user->isFaculty() && $user->faculty && $research->research_adviser === $user->faculty->id;
    }

    public function requestAdviserMetadata(User $user, Research $research): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function post(User $user, Research $research): bool
    {
        $status = $research->status?->value ?? $research->status;
        if ($status === ResearchStatus::ARCHIVED->value) {
            return false;
        }

        if ($user->isAdministrator() || $user->isMCIISStaff()) {
            // A reviewer must be able to post a completed submission.
            return in_array($status, [
                ResearchStatus::DRAFT->value,
                ResearchStatus::SUBMITTED->value,
                ResearchStatus::RETURNED->value,
                ResearchStatus::POSTED->value,
            ], true);
        }

        if ($user->isFaculty() && $user->faculty) {
            return $research->research_adviser === $user->faculty->id
                && in_array($status, [
                    ResearchStatus::DRAFT->value,
                    ResearchStatus::SUBMITTED->value,
                ], true);
        }

        return false;
    }

    /**
     * Determine whether the user can archive the model.
     */
    public function archive(User $user, Research $research): bool
    {
        if ($research->status === ResearchStatus::ARCHIVED) {
            return false;
        }

        if ($user->isAdministrator() || $user->isMCIISStaff()) {
            return true;
        }

        if ($user->isFaculty() && $user->faculty) {
            return $research->research_adviser === $user->faculty->id
                && in_array($research->status?->value ?? $research->status, [
                    ResearchStatus::DRAFT->value,
                ], true);
        }

        return false;
    }


    /**
     * Determine whether the user can restore the model from archive.
     */
    public function restore(User $user, Research $research): bool
    {
        return ($user->isAdministrator() || $user->isMCIISStaff())
            && $research->status === ResearchStatus::ARCHIVED;
    }

    public function hardDelete(User $user, Research $research): bool
    {
        if (! ResearchAccessRules::isStaffOrAdmin($user)) {
            return false;
        }

        if ($research->status === ResearchStatus::DRAFT) {
            return ! $research->hasInvitationOrAccessHistory();
        }

        if ($research->status === ResearchStatus::ARCHIVED && $research->archived_at) {
            $retentionDays = config('research.hard_delete_retention_days', 365);
            return $research->archived_at->lte(now()->subDays($retentionDays));
        }

        return false;
    }

    public function changeStatus(User $user, Research $research): bool
    {
        return ResearchAccessRules::isStaffOrAdmin($user);
    }

    public function manage(User $user): bool
    {
        return $user->isAdminOrStaff();
    }

    public function viewOwn(User $user): bool
    {
        return ($user->isFaculty() && $user->faculty !== null) || $user->isStudent();
    }
}
