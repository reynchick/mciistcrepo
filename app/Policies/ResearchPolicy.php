<?php


namespace App\Policies;


use App\Models\Research;
use App\Models\User;
use Illuminate\Auth\Access\Response;


class ResearchPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Anyone can view research list
        return true;
    }


    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Research $research): bool
    {
        // Anyone (including guests) can view individual research
        return true;
    }


    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, $adviserId = null): bool
    {
        // MCIIS Staff can create any research
        if ($user->isMCIISStaff()) {
            return true;
        }
       
        // Faculty can only create research they advise
        if ($user->isFaculty() && $user->faculty && $adviserId) {
            return $adviserId == $user->faculty->id;
        }
   
        return false;
    }


    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Research $research): bool
    {
        // MCIIS Staff can update any research
        if ($user->isMCIISStaff()) {
            return true;
        }
       
        // Faculty can only update research they advise
        if ($user->isFaculty() && $user->faculty) {
            return $research->research_adviser === $user->faculty->id;
        }
       
        return false;
    }


    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Research $research): bool
    {
        // Only MCIIS Staff can delete research
        return $user->isMCIISStaff();
    }


    /**
     * Determine whether the user can restore the model.
     */


    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Research $research): bool
    {
        // No one can permanently delete research
        return false;
    }


    /**
     * Determine whether the user can assign researchers to research.
     */
    public function assignResearcher(User $user, Research $research): bool
    {
        // MCIIS Staff can assign researchers to any research
        if ($user->isMCIISStaff()) {
            return true;
        }


        // Faculty can assign researchers to their own research
        if ($user->isFaculty() && $user->faculty) {
            return $research->research_adviser === $user->faculty->id;
        }


        return false;
    }


    /**
     * Determine whether the user can assign keywords to research.
     */
    public function assignKeyword(User $user, Research $research): bool
    {
        // MCIIS Staff can assign keywords to any research
        if ($user->isMCIISStaff()) {
            return true;
        }


        // Faculty can assign keywords to their own research
        if ($user->isFaculty() && $user->faculty) {
            return $research->research_adviser === $user->faculty->id;
        }


        return false;
    }


    /**
     * Determine whether the user can assign panelists to research.
     */
    public function assignPanelist(User $user, Research $research): bool
    {
        // MCIIS Staff can assign panelists to any research
        if ($user->isMCIISStaff()) {
            return true;
        }


        // Faculty can assign panelists to research they advise
        if ($user->isFaculty() && $user->faculty) {
            return $research->research_adviser === $user->faculty->id;
        }


        return false;
    }


    /**
     * Determine whether the user can generate reports.
     */
    public function generateReport(User $user): bool
    {
        // Administrator and MCIIS Staff can generate reports
        return $user->isAdministrator() || $user->isMCIISStaff();
    }


    /**
     * Determine whether the user can view research statistics.
     */
    public function viewStatistics(User $user): bool
    {
        // Administrator and MCIIS Staff can view statistics
        return $user->isAdministrator() || $user->isMCIISStaff();
    }


    /**
     * Determine whether the user can export research data.
     */
    public function export(User $user): bool
    {
        // Administrator and MCIIS Staff can export data
        return $user->isAdministrator() || $user->isMCIISStaff();
    }


    /**
     * Determine whether the user can manage research files (upload/download).
     */
    public function manageFiles(User $user, Research $research): bool
    {
        // MCIIS Staff can manage any research files
        if ($user->isMCIISStaff()) {
            return true;
        }
       
        // Faculty can manage files of research they advise
        if ($user->isFaculty() && $user->faculty) {
            return $research->research_adviser === $user->faculty->id;
        }
       
        return false;
    }


    /**
     * Determine whether the user can upload files to research.
     */
    public function uploadFiles(User $user, Research $research): bool
    {
        // MCIIS Staff can upload files to any research
        if ($user->isMCIISStaff()) {
            return true;
        }


        // Faculty can upload files to their own research
        if ($user->isFaculty()) {
            return $research->research_adviser === $user->id;
        }


        return false;
    }


    /**
     * Determine whether the user can view research details.
     */
    public function viewDetails(User $user, Research $research): bool
    {
        // All authenticated users can view research details
        return true;
    }


    /**
     * Determine whether the user can filter research by various criteria.
     */
    public function filter(User $user): bool
    {
        // All authenticated users can filter research
        return true;
    }


    /**
     * Determine whether the user can archive the model.
     */
    public function archive(User $user, Research $research): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }


    /**
     * Determine whether the user can restore the model from archive.
     */
    public function restore(User $user, Research $research): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function restoreFromArchive(User $user, Research $research): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function hardDelete(User $user, Research $research): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    public function changeStatus(User $user, Research $research): bool
    {
        return $user->isAdministrator() || $user->isMCIISStaff();
    }


    /**
     * Determine whether the user can view archived research.
     */
    public function viewArchived(User $user): bool
    {
        // Administrator and MCIIS Staff can view archived research
        return $user->isAdministrator() || $user->isMCIISStaff();
    }

    /**
     * Determine whether the user can access the Manage Research page.
     */
    public function manage(User $user): bool
    {
        return $user->isAdminOrStaff();
    }
}