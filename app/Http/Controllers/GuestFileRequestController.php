<?php

namespace App\Http\Controllers;

use App\Models\GuestFileRequest;
use App\Models\Research;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\FileAccessRequestWorkflowService;
use RuntimeException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class GuestFileRequestController extends Controller
{
    public function __construct(private FileAccessRequestWorkflowService $workflow)
    {
    }

    public function request(Request $request, Research $research): JsonResponse
    {
        $user = $request->user();
        if (!$user
            || !$request->session()->has('sso_authenticated_at')
            || !str_ends_with(strtolower((string) $user->email), '@usep.edu.ph')
            || !$user->google_id
            || !$user->email_verified_at) {
            return response()->json(['message' => 'Google SSO with a valid USeP account is required.'], 401);
        }

        $this->authorize('view', $research);

        $validated = $request->validate([
            'file_type' => ['required', 'string', 'in:manuscript,approval_sheet'],
        ]);

        $fileColumn = $validated['file_type'] === 'manuscript'
            ? 'research_manuscript'
            : 'research_approval_sheet';
        if ($research->status?->value !== 'posted'
            || !$research->{$fileColumn}
            || !Storage::disk('public')->exists($research->{$fileColumn})) {
            return response()->json(['message' => 'The requested file is unavailable.'], 422);
        }

        $alreadyAuthorized = $user->can('downloadFiles', $research);
        if ($alreadyAuthorized || $research->researchers()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'You already have direct access to this research.'], 403);
        }

        $recipientTokens = [];
        $guestRequest = DB::transaction(function () use ($request, $research, $user, $validated, &$recipientTokens): GuestFileRequest {
            $existing = GuestFileRequest::where('research_id', $research->id)
                ->where('guest_user_id', $user->id)
                ->where('file_type', $validated['file_type'])
                ->whereIn('status', ['requested', 'pending', 'pending_adviser_approval', 'escalated'])
                ->latest()
                ->first();
            if ($existing) {
                return $existing;
            }

            $guestRequest = GuestFileRequest::create([
                'research_id' => $research->id,
                'guest_session_id' => $request->session()->getId(),
                'guest_user_id' => $user->id,
                'file_type' => $validated['file_type'],
                'status' => 'pending_adviser_approval',
                'approval_policy' => 'adviser_final',
                'expires_at' => now()->addDays(14),
            ]);
            $recipientTokens = $this->workflow->issueRecipientTokens($guestRequest);
            if (!$research->adviser?->user) {
                $guestRequest->escalate();
            }

            return $guestRequest;
        });
        if ($recipientTokens !== []) {
            $this->workflow->queueRecipientNotifications($guestRequest, $recipientTokens);
        }
        if ($guestRequest->status === 'escalated') {
            $this->workflow->queueEscalationNotifications($guestRequest);
        }

        return response()->json([
            'message' => 'Request submitted.',
            'data' => [
                'id' => $guestRequest->id,
                'status' => $guestRequest->status,
            ],
        ]);
    }

    public function review(Request $request, GuestFileRequest $guestFileRequest): JsonResponse|InertiaResponse
    {
        try {
            $role = $this->workflow->review($guestFileRequest, $request->user(), (string) $request->query('token'));
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 403);
        }

        return Inertia::render('file-access-requests/review', [
            'request' => [
                'id' => $guestFileRequest->id,
                'status' => $guestFileRequest->status,
                'file_type' => $guestFileRequest->file_type,
                'role' => $role,
                'research_title' => $guestFileRequest->research->research_title,
                'lead_consent_received' => $guestFileRequest->lead_approved_at !== null,
            ],
        ]);
    }

    public function adviserIndex(Request $request): InertiaResponse
    {
        $user = $request->user();
        abort_unless($user?->isFaculty() && $user->faculty, 403);

        return $this->queueResponse(
            GuestFileRequest::with(['research', 'guestUser', 'events'])
                ->whereHas('research', fn ($query) => $query->where('research_adviser', $user->faculty->id))
                ->whereIn('status', ['pending', 'pending_adviser_approval', 'escalated'])
                ->latest()
                ->get(),
            'adviser',
        );
    }

    public function staffIndex(Request $request): InertiaResponse
    {
        abort_unless($request->user()?->isMCIISStaff(), 403);

        return $this->queueResponse(
            GuestFileRequest::with(['research', 'guestUser', 'events'])
                ->where('status', 'escalated')
                ->latest()
                ->get(),
            'staff',
        );
    }

    protected function queueResponse($requests, string $queue): InertiaResponse
    {
        return Inertia::render('file-access-requests/index', [
            'queue' => $queue,
            'requests' => $requests->map(fn (GuestFileRequest $request) => [
                'id' => $request->id,
                'status' => $request->status,
                'file_type' => $request->file_type,
                'research_title' => $request->research->research_title,
                'requester_name' => $request->guestUser?->full_name,
                'requester_email' => $request->guestUser?->email,
                'lead_consent_received' => $request->lead_approved_at !== null,
                'requested_at' => $request->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function approve(Request $request, GuestFileRequest $guestFileRequest): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $rawToken = $request->input('token');

        try {
            $guestFileRequest = $this->workflow->approve($guestFileRequest, $user, is_string($rawToken) ? $rawToken : null);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 403);
        }

        return response()->json([
            'message' => 'Approval recorded.',
            'data' => [
                'id' => $guestFileRequest->id,
                'status' => $guestFileRequest->status,
            ],
        ]);
    }

    public function reject(Request $request, GuestFileRequest $guestFileRequest): JsonResponse
    {
        $user = $request->user();
        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:2000']])['reason'] ?? null;
        $rawToken = $request->input('token');

        try {
            $guestFileRequest = $this->workflow->reject($guestFileRequest, $user, $reason, is_string($rawToken) ? $rawToken : null);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 403);
        }

        return response()->json(['message' => 'Request rejected.', 'data' => ['id' => $guestFileRequest->id, 'status' => 'rejected']]);
    }
}
