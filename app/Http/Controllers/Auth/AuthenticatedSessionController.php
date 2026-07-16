<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Faculty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'status' => $request->session()->get('status'),
            'error' => $request->session()->get('error'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Check if email is verified
        if (!$request->user()->hasVerifiedEmail()) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return redirect()->route('verification.notice')
                ->with('status', 'Please verify your email address before logging in.');
        }

        // Check if faculty needs to complete profile
        if ($request->user()->isFaculty() && $request->user()->faculty_id) {
            $faculty = Faculty::where('faculty_id', $request->user()->faculty_id)->first();
            
            if ($faculty) {
                // Check if profile is incomplete (position/designation only; contact number is optional)
                $profileIncomplete = empty($faculty->position) ||
                                   empty($faculty->designation);
                
                if ($profileIncomplete) {
                    return redirect()->route('faculty.profile.complete')
                        ->with('status', 'Welcome! Please complete your faculty profile.');
                }
            }
        }

        $request->session()->put('active_role', $request->user()->dashboardRoleName() ?? 'Student');

        return redirect()->intended(route('browse', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
