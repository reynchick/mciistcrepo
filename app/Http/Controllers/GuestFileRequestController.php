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
            'file_type' => ['required', 'string', 'in:manuscript'],
        ]);

        $fileColumn = 'research_manuscript';
        if ($research->status?->value !== 'posted'
            || !$research->{$fileColumn}
            || !Storage::disk('private')->exists($research->{$fileColumn})) {
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
                if ($existing->updated_at?->lt(now()->subMinutes(10))) {
                    $recipientTokens = $this->workflow->refreshRecipientTokens($existing);
                    $existing->touch();
                }
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

            return $guestRequest;
        });
        if ($recipientTokens !== []) {
            $this->workflow->queueRecipientNotifications($guestRequest, $recipientTokens);
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
            $user = $request->user();
            $role = $request->filled('token')
                ? $this->workflow->review($guestFileRequest, $user, (string) $request->query('token'))
                : $this->workflow->reviewFromQueue($guestFileRequest, $user);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 403);
        }

        return $this->renderReviewPage($guestFileRequest, $role, null, $request->query('token'));
    }

    public function adviserIndex(Request $request): InertiaResponse
    {
        $user = $request->user();
        abort_unless($user?->isFaculty() && $user->faculty, 403);

        return $this->queueResponse(
            GuestFileRequest::with(['research.adviser.user', 'research.researchers.user', 'guestUser', 'events'])
                ->whereHas('research', fn ($query) => $query->where('research_adviser', $user->faculty->id))
                ->whereIn('status', $this->requestStatuses($request))
                ->latest()
                ->get(),
            'adviser',
            $this->requestTab($request),
        );
    }

    public function studentIndex(Request $request): InertiaResponse
    {
        $user = $request->user();
        abort_unless($user?->isStudent(), 403);
        abort_unless(\App\Models\Researcher::where('user_id', $user->id)->where('is_lead_author', true)->exists(), 403);

        return $this->queueResponse(
            GuestFileRequest::with(['research.adviser.user', 'research.researchers.user', 'guestUser', 'events'])
                ->whereHas('research.researchers', fn ($query) => $query
                    ->where('user_id', $user->id)
                    ->where('is_lead_author', true))
                ->whereIn('status', $this->requestStatuses($request))
                ->latest()
                ->get(),
            'student',
            $this->requestTab($request),
        );
    }

    public function staffIndex(Request $request): InertiaResponse
    {
        abort_unless($request->user()?->isMCIISStaff(), 403);

        return $this->queueResponse(
            GuestFileRequest::with(['research.adviser.user', 'research.researchers.user', 'guestUser', 'events'])
                ->whereIn('status', $this->requestStatuses($request))
                ->latest()
                ->get(),
            'staff',
            $this->requestTab($request),
        );
    }

    protected function requestTab(Request $request): string
    {
        return $request->query('status') === 'approved' ? 'approved' : 'pending';
    }

    protected function requestStatuses(Request $request): array
    {
        return $this->requestTab($request) === 'approved'
            ? ['approved']
            : ['pending', 'pending_adviser_approval', 'escalated'];
    }

    protected function queueResponse($requests, string $queue, string $tab): InertiaResponse
    {
        return Inertia::render('file-access-requests/index', [
            'queue' => $queue,
            'tab' => $tab,
            'requests' => $requests->map(fn (GuestFileRequest $request) => $this->requestSummary($request))->values(),
        ]);
    }

    protected function requestSummary(GuestFileRequest $request): array
    {
        $lead = $request->research->researchers->firstWhere('is_lead_author', true);
        $adviser = $request->research->adviser;
        $leadEmail = $lead?->user?->email ?: $lead?->email;
        $adviserEmail = $adviser?->user?->email ?: $adviser?->email;

        return [
            'id' => $request->id,
            'status' => $request->status,
            'file_type' => $request->file_type,
            'research_title' => $request->research->research_title,
            'requester_name' => $request->guestUser?->full_name,
            'requester_email' => $request->guestUser?->email,
            'adviser_name' => $adviser?->full_name,
            'adviser_email' => $adviserEmail,
            'adviser_email_available' => $adviserEmail !== null,
            'adviser_email_status' => $request->adviser_email_status,
            'lead_name' => $lead?->full_name,
            'lead_email' => $leadEmail,
            'lead_email_available' => $leadEmail !== null,
            'lead_email_status' => $request->lead_email_status,
            'lead_consent_received' => $request->lead_approved_at !== null,
            'escalation_reason' => $this->escalationReason($request, $adviserEmail, $leadEmail),
            'contact_warning' => $this->contactWarning($request, $adviserEmail, $leadEmail),
            'requested_at' => $request->created_at?->toIso8601String(),
        ];
    }

    protected function escalationReason(GuestFileRequest $request, ?string $adviserEmail, ?string $leadEmail): ?string
    {
        if ($request->status !== 'escalated') {
            return null;
        }

        $missingContacts = [];
        if (!$adviserEmail || $request->adviser_email_status === 'failed') {
            $missingContacts[] = 'the adviser email was unavailable';
        }
        if (!$leadEmail || $request->lead_email_status === 'failed') {
            $missingContacts[] = 'the lead author email was unavailable';
        }

        if ($missingContacts !== []) {
            return 'This request was escalated to MCIIS Staff after 7 days. ' . ucfirst(implode(' and ', $missingContacts)) . ', so the normal approval notification could not be completed.';
        }

        return 'The adviser and lead author did not respond within 7 days, so this request was escalated to MCIIS Staff for review.';
    }

    protected function contactWarning(GuestFileRequest $request, ?string $adviserEmail, ?string $leadEmail): ?string
    {
        if ($request->status === 'escalated') {
            return null;
        }

        $missingContacts = [];
        if (!$adviserEmail || $request->adviser_email_status === 'failed') {
            $missingContacts[] = 'the adviser email is unavailable';
        }
        if (!$leadEmail || $request->lead_email_status === 'failed') {
            $missingContacts[] = 'the lead author email is unavailable';
        }

        return $missingContacts === []
            ? null
            : ucfirst(implode(' and ', $missingContacts)) . '. The request remains pending and will follow the normal seven-day escalation process.';
    }

    public function approve(Request $request, GuestFileRequest $guestFileRequest): JsonResponse|InertiaResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $role = session('file_access_review_role')
            ?? ($user->isMCIISStaff() ? 'staff' : 'adviser');
        $rawToken = $request->input('token');

        try {
            $guestFileRequest = $this->workflow->approve($guestFileRequest, $user, is_string($rawToken) ? $rawToken : null);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 403);
        }

        return $this->renderReviewPage($guestFileRequest, (string) $role, 'Approval recorded.', is_string($rawToken) ? $rawToken : null);
    }

    public function reject(Request $request, GuestFileRequest $guestFileRequest): JsonResponse|InertiaResponse
    {
        $user = $request->user();
        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:2000']])['reason'] ?? null;
        $rawToken = $request->input('token');

        try {
            $guestFileRequest = $this->workflow->reject($guestFileRequest, $user, $reason, is_string($rawToken) ? $rawToken : null);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 403);
        }

        $role = session('file_access_review_role')
            ?? ($request->user()?->isMCIISStaff() ? 'staff' : 'adviser');

        return $this->renderReviewPage($guestFileRequest, (string) $role, 'Request rejected.', is_string($rawToken) ? $rawToken : null);
    }

    protected function renderReviewPage(GuestFileRequest $guestFileRequest, string $role, ?string $notice = null, ?string $actionToken = null): InertiaResponse
    {
        return Inertia::render('file-access-requests/review', [
            'request' => [
                'id' => $guestFileRequest->id,
                'status' => $guestFileRequest->status,
                'file_type' => $guestFileRequest->file_type,
                'role' => $role,
                'action_token' => $actionToken,
                'research_title' => $guestFileRequest->research->research_title,
                'requester_name' => $guestFileRequest->guestUser?->full_name,
                'requester_email' => $guestFileRequest->guestUser?->email,
                'adviser_name' => $guestFileRequest->research->adviser?->full_name,
                'adviser_email' => $guestFileRequest->research->adviser?->user?->email ?: $guestFileRequest->research->adviser?->email,
                'adviser_email_available' => (bool) ($guestFileRequest->research->adviser?->user?->email ?: $guestFileRequest->research->adviser?->email),
                'adviser_email_status' => $guestFileRequest->adviser_email_status,
                'lead_name' => ($lead = $guestFileRequest->research->researchers->firstWhere('is_lead_author', true))?->full_name,
                'lead_email' => $lead?->user?->email ?: $lead?->email,
                'lead_email_available' => (bool) ($lead?->user?->email ?: $lead?->email),
                'lead_email_status' => $guestFileRequest->lead_email_status,
                'lead_consent_received' => $guestFileRequest->lead_approved_at !== null,
                'escalation_reason' => $this->escalationReason(
                    $guestFileRequest,
                    $guestFileRequest->research->adviser?->user?->email ?: $guestFileRequest->research->adviser?->email,
                    $lead?->user?->email ?: $lead?->email,
                ),
                'contact_warning' => $this->contactWarning(
                    $guestFileRequest,
                    $guestFileRequest->research->adviser?->user?->email ?: $guestFileRequest->research->adviser?->email,
                    $lead?->user?->email ?: $lead?->email,
                ),
                'notice' => $notice,
            ],
        ]);
    }
}
