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
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Skip if no authenticated user
        if (!$user) {
            return $next($request);
        }

        // Skip if profile is already completed
        if ($user->profile_completed) {
            return $next($request);
        }

        // Skip for profile completion routes themselves
        if ($request->routeIs('student.profile.complete') || 
            $request->routeIs('faculty.profile.complete') ||
            $request->routeIs('student.profile.complete.store') ||
            $request->routeIs('faculty.profile.complete.store') ||
            $request->routeIs('logout')) {
            return $next($request);
        }

        // At this point, user has profile_completed = false, so redirect to appropriate completion page
        
        // Redirect students to complete profile
        if ($user->isStudent()) {
            return redirect()->route('student.profile.complete')
                ->with('status', 'Please complete your profile to continue.');
        }

        // Redirect faculty to complete/verify profile
        if ($user->isFaculty()) {
            return redirect()->route('faculty.profile.complete')
                ->with('status', 'Welcome! Please verify and update your profile information.');
        }

        // For other roles (Admin, Staff) with incomplete profiles, allow access
        // They don't have a profile completion flow
        return $next($request);
    }
}
