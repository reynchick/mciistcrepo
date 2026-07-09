<?php

namespace App\Policies;

use App\Models\Researcher;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ResearcherPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Researcher $researcher): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, \App\Models\Research $research = null): bool
    {
        // MCIIS Staff can add researchers to any research
        if ($user->isMCIISStaff()) {
            return true;
        }
        
        // Faculty can only add researchers to research they advise
        if ($user->isFaculty() && $user->faculty && $research) {
            return $research->research_adviser === $user->faculty->id;
        }
        
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Researcher $researcher): bool
    {
        // MCIIS Staff can update any researcher
        if ($user->isMCIISStaff()) {
            return true;
        }
        
        // Faculty can update researchers of research they advise
        if ($user->isFaculty() && $user->faculty) {
            $research = $researcher->research;
            return $research && $research->research_adviser === $user->faculty->id;
        }
        
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Researcher $researcher): bool
    {
       // MCIIS Staff can delete any researcher
        if ($user->isMCIISStaff()) {
            return true;
        }
        
        // Faculty can delete researchers of research they advise
        if ($user->isFaculty() && $user->faculty) {
            $research = $researcher->research;
            return $research && $research->research_adviser === $user->faculty->id;
        }
        
        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Researcher $researcher): bool
    {
        // MCIIS Staff can restore any researcher
        if ($user->isMCIISStaff()) {
            return true;
        }
        
        // Faculty can restore researchers of research they advise
        if ($user->isFaculty() && $user->faculty) {
        $research = $researcher->research;
            return $research && $research->research_adviser === $user->faculty->id;
        }
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Researcher $researcher): bool
    {
        return $user->isMCIISStaff();
    }
}
