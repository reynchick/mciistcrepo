<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $roles = $user?->roles()->orderBy('roles.name')->get(['roles.id', 'roles.name'])->map(fn ($role) => [
            'id' => $role->id,
            'name' => $role->name,
        ])->values()->all() ?? [];

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'roles' => $roles,
            'activeRole' => $request->session()->get('active_role', $user?->roles()->first()?->name),
            'faculty' => $user?->faculty ? $user->faculty->only([
                'faculty_id',
                'first_name',
                'middle_name',
                'last_name',
                'position',
                'designation',
                'orcid',
                'contact_number',
                'educational_attainment',
                'field_of_specialization',
                'research_interest',
            ]) : null,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->fill($validated);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($user->isFaculty()) {
            $faculty = $user->faculty()->first();

            if ($faculty) {
                $faculty->fill([
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'],
                    'last_name' => $validated['last_name'],
                    'position' => $validated['position'] ?? null,
                    'designation' => $validated['designation'] ?? null,
                    'orcid' => $validated['orcid'] ?? null,
                    'contact_number' => $validated['contact_number'] ?? null,
                    'educational_attainment' => $validated['educational_attainment'] ?? null,
                    'field_of_specialization' => $validated['field_of_specialization'] ?? null,
                    'research_interest' => $validated['research_interest'] ?? null,
                ]);

                $faculty->save();
            }
        }

        return to_route('profile.edit');
    }

    /**
     * Switch the user's active role for the current session.
     */
    public function switchRole(Request $request): RedirectResponse
    {
        $requestedRole = trim((string) $request->input('role', ''));
        $roleName = match (mb_strtolower($requestedRole)) {
            'administrator', 'admin' => 'Administrator',
            'mciis staff', 'mciis_staff', 'staff' => 'MCIIS Staff',
            'faculty' => 'Faculty',
            'student' => 'Student',
            default => $requestedRole,
        };

        $user = $request->user();

        if (! $user || ! $user->roles()->where('name', $roleName)->exists()) {
            return back()->withErrors(['role' => 'The selected role is not assigned to this user.']);
        }

        $request->session()->put('active_role', $roleName);

        $routeMap = [
            'Administrator' => '/dashboard',
            'MCIIS Staff' => '/staff/browse',
            'Faculty' => '/faculty/browse',
            'Student' => '/student/browse',
        ];

        $destination = $routeMap[$roleName] ?? '/browse';

        return redirect($destination);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $lastConfirmedAt = (int) $request->session()->get('sso_authenticated_at', 0);
        $isFreshGoogleSession = $lastConfirmedAt > 0 && (now()->timestamp - $lastConfirmedAt) <= 300;

        if (! $isFreshGoogleSession) {
            $request->session()->put('pending_account_deletion', true);

            Auth::logout();
            $request->session()->regenerateToken();

            return redirect()->route('auth.google');
        }

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
