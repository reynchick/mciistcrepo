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

        // Skip if profile completion routes or logout are requested
        if ($request->routeIs('student.profile.complete') || 
            $request->routeIs('faculty.profile.complete') ||
            $request->routeIs('student.profile.complete.store') ||
            $request->routeIs('faculty.profile.complete.store') ||
            $request->routeIs('logout')) {
            return $next($request);
        }

        if ($user->needsStudentProfileCompletion()) {
            return redirect()->guest(route('student.profile.complete'))
                ->with('status', 'Please complete your student profile to continue.');
        }

        if ($user->needsFacultyProfileCompletion()) {
            return redirect()->guest(route('faculty.profile.complete'))
                ->with('status', 'Please complete your faculty profile to continue.');
        }

        $response = $next($request);

        if ($request->routeIs('student.my-researches')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        }

        return $response;
    }
}
