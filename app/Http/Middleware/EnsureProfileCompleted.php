<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileCompleted
{
    /**
     * Handle an incoming request.
     * 
     * Redirect users with incomplete profiles to the appropriate completion page.
     * Also deny access to students whose access has been revoked.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Skip if no authenticated user
        if (!$user) {
            return $next($request);
        }

        // Skip if profile completion routes, settings routes, or logout are requested
        if ($request->routeIs('faculty.profile.complete') ||
            $request->routeIs('faculty.profile.complete.store') ||
            $request->routeIs('profile.edit') ||
            $request->routeIs('profile.update') ||
            $request->routeIs('profile.switch-role') ||
            $request->routeIs('profile.destroy') ||
            $request->routeIs('appearance') ||
            $request->routeIs('logout')) {
            return $next($request);
        }

        // Check if student access has been revoked
        if ($user->isStudent() && $user->student_access_revoked_at) {
            return redirect()->route('login')
                ->with('error', 'Your student account access has been revoked. Please contact the administrator.');
        }

        // Check if student is not yet approved (should not happen in normal flow, but extra safety)
        if ($user->isStudent() && !$user->student_access_approved) {
            return redirect()->route('login')
                ->with('error', 'Your student account is not yet approved. Please contact the administrator.');
        }

        if ($user->needsFacultyProfileCompletion()) {
            return redirect()->route('faculty.profile.complete')
                ->with('status', 'Please complete your faculty profile to continue.');
        }

        return $next($request);
    }
}
