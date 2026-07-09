<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\FacultyAuditLog;
use App\Models\UserAuditLog;
use App\Observers\FacultyObserver;
use App\Observers\UserObserver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompleteFacultyProfileController extends Controller
{
    /**
     * Show the faculty profile completion page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        
        // Only faculty need this page
        if (!$user->isFaculty()) {
            return redirect()->route('dashboard');
        }

        // Completed faculty profiles should not see this page again
        if ($user->profile_completed) {
            return redirect()->route('browse');
        }

        // If user doesn't have faculty_id set, try to find and link it
        if (!$user->faculty_id) {
            $faculty = Faculty::where('email', $user->email)->first();
            
            if ($faculty) {
                // Link the user to the faculty record
                $user->update(['faculty_id' => $faculty->faculty_id]);
            }
        }

        // Load the faculty record using the relationship
        // This correctly matches faculty_id (string) instead of id (integer)
        $faculty = $user->faculty;

        return Inertia::render('auth/complete-faculty-profile', [
            'user' => $user,
            'faculty' => $faculty,
        ]);
    }

    /**
     * Store the completed faculty profile information.
     * 
     * Faculty can only edit their own profile.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->isFaculty()) {
            abort(403, 'Unauthorized');
        }

        // Validate input
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:255'],
            'orcid' => ['nullable', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'educational_attainment' => ['nullable', 'string', 'max:255'],
            'field_of_specialization' => ['nullable', 'string'],
            'research_interest' => ['nullable', 'string'],
        ]);

        // Set custom metadata for UserObserver before updating user
        UserObserver::$customMetadata = [
            'source' => $user->created_by_admin 
                ? UserAuditLog::SOURCE_ADMIN_CREATED 
                : UserAuditLog::SOURCE_GOOGLE_SSO,
            'context' => UserAuditLog::CONTEXT_PROFILE_COMPLETION,
            'note' => 'Profile completed',
        ];

        // Update user record with profile completion flag - UserObserver will automatically log this
        $user->update([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'last_name' => $validated['last_name'],
            'contact_number' => $validated['contact_number'],
            'profile_completed' => true,
        ]);

        // If user has a faculty relationship, update the faculty record as well
        if ($user->faculty) {
            $faculty = $user->faculty;

            if ($faculty) {
                // Set custom metadata for FacultyObserver before updating faculty
                FacultyObserver::$customMetadata = [
                    'context' => FacultyAuditLog::CONTEXT_PROFILE_COMPLETION,
                    'note' => 'Profile completed',
                ];

                // Update faculty record - FacultyObserver will automatically log this
                // Update all editable fields including name (not faculty_id, email)
                $faculty->update([
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'],
                    'last_name' => $validated['last_name'],
                    'position' => $validated['position'],
                    'designation' => $validated['designation'],
                    'orcid' => $validated['orcid'],
                    'contact_number' => $validated['contact_number'],
                    'educational_attainment' => $validated['educational_attainment'],
                    'field_of_specialization' => $validated['field_of_specialization'],
                    'research_interest' => $validated['research_interest'],
                ]);
            }
        }

        return redirect()->route('browse')
            ->with('status', 'Profile completed successfully!');
    }
}