<?php

namespace App\Http\Controllers;

use App\Models\GuestFileRequest;
use App\Models\Research;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GuestFileRequestController extends Controller
{
    public function request(Request $request, Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        $validated = $request->validate([
            'file_type' => ['required', 'string', 'in:manuscript,approval_sheet'],
        ]);

        $guestRequest = GuestFileRequest::create([
            'research_id' => $research->id,
            'guest_session_id' => $request->session()->getId(),
            'guest_user_id' => $request->user()?->id,
            'file_type' => $validated['file_type'],
            'status' => 'requested',
        ]);

        return response()->json([
            'message' => 'Request submitted.',
            'data' => [
                'id' => $guestRequest->id,
                'status' => $guestRequest->status,
            ],
        ]);
    }

    public function approve(Request $request, GuestFileRequest $guestFileRequest): JsonResponse
    {
        $approvalType = $request->input('approval');

        if (!in_array($approvalType, ['lead', 'adviser'], true)) {
            return response()->json(['message' => 'Invalid approval type.'], 422);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $research = $guestFileRequest->research;
        $isLead = $research->researchers()->where('is_lead_author', true)->where('email', $user->email)->exists();
        $isAdviser = $research->adviser !== null && (
            $research->adviser->user()->where('users.id', $user->id)->exists()
            || $user->faculty?->id === $research->adviser->id
            || $user->faculty?->faculty_id === $research->adviser->faculty_id
            || $user->email === $research->adviser->email
            || $user->email === $research->adviser->user?->email
        );

        if ($approvalType === 'lead' && !$isLead) {
            return response()->json(['message' => 'You are not authorized to approve this request as lead author.'], 403);
        }

        if ($approvalType === 'adviser' && !$isAdviser) {
            return response()->json(['message' => 'You are not authorized to approve this request as adviser.'], 403);
        }

        $guestFileRequest->approve($approvalType);

        return response()->json([
            'message' => 'Approval recorded.',
            'data' => [
                'id' => $guestFileRequest->id,
                'status' => $guestFileRequest->status,
            ],
        ]);
    }
}
