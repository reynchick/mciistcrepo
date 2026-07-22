<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict a route to users holding one of the given roles.
 *
 * Usage: ->middleware('role:MCIIS Staff') or 'role:MCIIS Staff,Administrator'.
 * Role matching is delegated to User::hasAnyRole(), which understands both
 * the persisted roles and the session's active_role (and normalizes aliases
 * like "staff" -> "MCIIS Staff").
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasAnyRole($roles)) {
            abort(403);
        }

        return $next($request);
    }
}
