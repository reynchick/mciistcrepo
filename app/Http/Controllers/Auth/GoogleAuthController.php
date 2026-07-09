<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Role;
use App\Models\User;
use App\Models\UserAuditLog;
use App\Observers\UserObserver;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect to Google OAuth page.
     */
    public function redirect(Request $request): RedirectResponse
    {
        /** @var \Laravel\Socialite\Two\GoogleProvider $driver */
        $driver = Socialite::driver('google');

        if ($request->session()->get('pending_account_deletion', false)) {
            $driver = $driver->with(['hd' => 'usep.edu.ph', 'prompt' => 'login']);

            return $driver->redirect();
        }
        
        return $driver
            ->with(['hd' => 'usep.edu.ph']) // Restrict to USeP domain
            ->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            // Validate that the email is from usep.edu.ph domain
            if (!str_ends_with($googleUser->getEmail(), '@usep.edu.ph')) {
                return redirect()->route('login')
                    ->with('error', 'Only USeP email addresses (@usep.edu.ph) are allowed.');
            }

            // Find or create user
            $user = User::where('email', $googleUser->getEmail())
                ->orWhere('google_id', $googleUser->getId())
                ->first();

            $isNewUser = false;

            if ($user) {
                // Determine source based on how the account was created
                $source = $user->created_by_admin
                    ? UserAuditLog::SOURCE_ADMIN_CREATED
                    : UserAuditLog::SOURCE_GOOGLE_SSO;

                // If user is faculty but doesn't have faculty_id set, link it
                if ($user->isFaculty() && !$user->faculty_id) {
                    $faculty = Faculty::where('email', $user->email)->first();
                    if ($faculty) {
                        $user->faculty_id = $faculty->faculty_id;
                    }
                }

                // Update existing user with Google info
                UserObserver::$customMetadata = [
                    'source' => $source,
                    'context' => UserAuditLog::CONTEXT_FIRST_LOGIN,
                    'note' => 'User logged in via Google SSO',
                ];
                
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'email_verified_at' => $user->email_verified_at ?? now(), // Auto-verify via Google
                    'first_login_completed' => true,
                    'faculty_id' => $user->faculty_id, // Include faculty_id in update
                ]);
            } else {
                // Set custom metadata for UserObserver before creating user
                UserObserver::$customMetadata = [
                    'source' => UserAuditLog::SOURCE_GOOGLE_SSO,
                    'context' => UserAuditLog::CONTEXT_USER_REGISTRATION,
                    'note' => 'User registered via Google SSO',
                    'google_id' => $googleUser->getId(),
                ];

                // Create new user from Google account
                // UserObserver will automatically log this with the custom metadata
                $user = $this->createUserFromGoogle($googleUser);
                $isNewUser = true;
            }

            // Log the user in
            Auth::login($user, true);

            $request->session()->put('sso_authenticated_at', now()->timestamp);

            if ($request->session()->get('pending_account_deletion', false)) {
                $request->session()->forget('pending_account_deletion');

                return redirect()->route('profile.edit', [
                    'delete_account' => 1,
                ])->with('status', 'Google sign-in confirmed. You can now delete your account.');
            }

            // Check if student needs to complete profile (missing student_id)
            if ($user->isStudent() && !$user->student_id) {
                return redirect()->route('student.profile.complete')
                    ->with('status', 'Welcome! Please complete your profile by entering your student ID.');
            }

            // Check if faculty needs to verify/update profile on first login
            // Faculty data is pre-seeded, so we just redirect if profile_completed = false
            // This allows them to verify and update their information on first system access
            if ($user->isFaculty() && $user->faculty_id && !$user->profile_completed) {
                return redirect()->route('faculty.profile.complete')
                    ->with('status', 'Welcome! Please verify and update your profile information.');
            }

            return redirect()->intended(route('browse', absolute: false));

        } catch (\Exception $e) {
            return redirect()->route('login')
                ->with('error', 'Failed to authenticate with Google. Please try again.');
        }
    }

    /**
     * Create a new user from Google OAuth data.
     * 
     * Priority order:
     * 1. Check if user already exists (pre-seeded admin/staff)
     * 2. Check faculty table
     * 3. Default to student
     */
    protected function createUserFromGoogle($googleUser): User
    {
        $email = $googleUser->getEmail();
        
        // Check if user already exists (pre-seeded admin/staff from seeder)
        $existingUser = User::where('email', $email)->first();
        
        if ($existingUser) {
            // Pre-seeded admin/staff account found
            // Already updated in callback(), just return it
            return $existingUser;
        }
        
        // Check if this email exists in the faculty table
        $faculty = Faculty::where('email', $email)->first();
        
        if ($faculty) {
            // Faculty found - create faculty user
            return $this->createFacultyUser($googleUser, $faculty);
        } else {
            // Not in faculty table - create student user
            return $this->createStudentUser($googleUser);
        }
    }

    /**
     * Create a student user from Google OAuth data.
     */
    protected function createStudentUser($googleUser): User
    {
        // Parse name from Google
        $nameParts = explode(' ', $googleUser->getName());
        $firstName = $nameParts[0] ?? '';
        $lastName = end($nameParts) ?? '';
        $middleName = count($nameParts) > 2 ? $nameParts[1] : null;

        // Student ID cannot be reliably extracted from email format
        // Student will be prompted to enter their full student ID (e.g., 2023-00800) after login
        $studentId = null;

        $studentRole = Role::where('name', 'Student')->firstOrFail();

        $user = User::create([
            'google_id' => $googleUser->getId(),
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'student_id' => $studentId,
            'email' => $googleUser->getEmail(),
            'avatar' => $googleUser->getAvatar(),
            'email_verified_at' => now(),
            'password' => null,
            'profile_completed' => false,
            'first_login_completed' => true,
            'created_by_admin' => false,  // Self-registered via Google SSO
        ]);

        // Attach Student role (multi-role support)
        $user->roles()->attach($studentRole->id);

        event(new Registered($user));

        return $user;
    }

    /**
     * Create a faculty user from Google OAuth data.
     * Faculty must exist in the faculty table first.
     */
    protected function createFacultyUser($googleUser, Faculty $faculty): User
    {
        $facultyRole = Role::where('name', 'Faculty')->firstOrFail();

        $user = User::create([
            'google_id' => $googleUser->getId(),
            'first_name' => $faculty->first_name,
            'middle_name' => $faculty->middle_name,
            'last_name' => $faculty->last_name,
            'faculty_id' => $faculty->faculty_id,
            'contact_number' => $faculty->contact_number,
            'email' => $faculty->email,
            'avatar' => $googleUser->getAvatar(),
            'email_verified_at' => now(),
            'password' => null,
            'profile_completed' => false,
            'first_login_completed' => true,
            'created_by_admin' => false,  // Self-registered via Google SSO
        ]);

        // Attach Faculty role (multi-role support)
        $user->roles()->attach($facultyRole->id);

        event(new Registered($user));

        return $user;
    }
}