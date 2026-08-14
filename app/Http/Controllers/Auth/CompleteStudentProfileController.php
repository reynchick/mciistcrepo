<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserAuditLog;
use App\Observers\UserObserver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CompleteStudentProfileController extends Controller
{
    /**
     * Show the profile completion page for new students.
     * 
     * Students who register via Google SSO need to provide:
     * - Student ID (cannot be extracted from email)
     * - Contact number (optional)
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        
        // Only students need this page
        if (!$user->isStudent()) {
            return redirect()->route('dashboard');
        }

        // Completed student profiles should not see this page again
        if (!$user->needsStudentProfileCompletion()) {
            return redirect()->route('browse');
        }
        
        return Inertia::render('auth/complete-student-profile', [
            'user' => $user,
        ]);
    }

    /**
     * Store the completed profile information.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $studentIdRules = [
            'required',
            'regex:/^\d{4}-\d{5}$/',
            'unique:users,student_id,' . $user->id,
        ];

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'student_id' => $studentIdRules,
            'contact_number' => ['nullable', 'regex:/^(09|\+63\s?9)\d{9}$/'],
        ], [
            'student_id.regex' => 'Student ID must be in format YYYY-NNNNN (e.g., 2023-00800)',
            'contact_number.regex' => 'Please enter a valid Philippine mobile number',
        ]);

        // Set custom metadata for UserObserver before updating
        UserObserver::$customMetadata = [
            'source' => $user->created_by_admin 
                ? UserAuditLog::SOURCE_ADMIN_CREATED 
                : UserAuditLog::SOURCE_GOOGLE_SSO,
            'context' => UserAuditLog::CONTEXT_PROFILE_COMPLETION,
            'note' => 'Profile completed',
        ];
        
        // Update user with profile data and mark profile as complete
        $user->update(array_merge($validated, [
            'student_profile_completed' => true,
        ]));

        // Ensure the authenticated user instance reflects the DB change
        $user->refresh();
        Auth::setUser($user);
        $request->session()->regenerate();

        $request->session()->put('active_role', 'Student');

        return redirect()->route($user->profileCompletionRedirectRoute())
            ->with('status', 'Profile completed successfully!');
    }
}