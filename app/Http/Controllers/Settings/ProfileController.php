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
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

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
