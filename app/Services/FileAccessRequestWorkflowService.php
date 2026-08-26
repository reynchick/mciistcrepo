<?php

namespace App\Services;

use App\Models\GuestFileRequest;
use App\Models\GuestFileRequestToken;
use App\Models\User;
use App\Mail\FileAccessRequestMail;
use App\Mail\FileAccessRequestEscalatedMail;
use App\Mail\FileAccessRequestExpiredMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;

class FileAccessRequestWorkflowService
{
    public function issueToken(GuestFileRequest $request, string $role): string
    {
        if ($request->tokens()->where('recipient_role', $role)->whereNull('used_at')->exists()) {
            throw new RuntimeException('An active approval token already exists for this role.');
        }

        $rawToken = Str::random(64);

        $request->tokens()->create([
            'recipient_role' => $role,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => $request->expires_at ?? now()->addDays(14),
        ]);

        return $rawToken;
    }

    public function issueRecipientTokens(GuestFileRequest $request): array
    {
        $tokens = [];

        if ($this->usableRecipient($request->research->adviser?->user)) {
            $tokens['adviser'] = $this->issueToken($request, 'adviser');
        }

        $leadExists = $request->research->researchers()
            ->where('is_lead_author', true)
            ->whereNotNull('user_id')
            ->whereHas('user', fn ($query) => $query
                ->whereNotNull('email_verified_at')
                ->where('email', 'like', '%@usep.edu.ph'))
            ->exists();
        if ($leadExists) {
            $tokens['lead'] = $this->issueToken($request, 'lead');
        }

        return $tokens;
    }

    public function queueRecipientNotifications(GuestFileRequest $request, array $tokens): void
    {
        $research = $request->research;
        $adviser = $research->adviser?->user;
        if ($adviser && isset($tokens['adviser'])) {
            $request->forceFill(['adviser_email_status' => 'queued'])->save();
            Mail::to($adviser->email)->queue(new FileAccessRequestMail($request->fresh(), $tokens['adviser'], 'adviser'));
        }

        $lead = $research->researchers()
            ->where('is_lead_author', true)
            ->whereNotNull('user_id')
            ->with('user')
            ->first()?->user;
        if ($lead && isset($tokens['lead'])) {
            $request->forceFill(['lead_email_status' => 'queued'])->save();
            Mail::to($lead->email)->queue(new FileAccessRequestMail($request->fresh(), $tokens['lead'], 'lead'));
        }
    }

    public function queueEscalationNotifications(GuestFileRequest $request): void
    {
        User::whereHas('roles', fn ($query) => $query->where('name', 'MCIIS Staff'))
            ->whereNotNull('email_verified_at')
            ->get()
            ->each(fn (User $staff) => Mail::to($staff->email)
                ->queue(new FileAccessRequestEscalatedMail($request->fresh(), $staff)));
    }

    public function queueExpirationNotification(GuestFileRequest $request): void
    {
        if ($request->guestUser?->email) {
            Mail::to($request->guestUser->email)->queue(new FileAccessRequestExpiredMail($request->fresh()));
        }
    }

    public function review(GuestFileRequest $request, User $user, string $rawToken): string
    {
        $tokenHash = hash('sha256', $rawToken);
        $token = $request->tokens()
            ->where('token_hash', $tokenHash)
            ->whereNull('used_at')
            ->first();

        if (!$token || $token->expires_at->isPast() || !$this->canActAs($request, $user, $token->recipient_role)) {
            throw new RuntimeException('Invalid or unauthorized approval token.');
        }

        session([
            'file_access_review_request' => $request->id,
            'file_access_review_token_hash' => $tokenHash,
            'file_access_review_role' => $token->recipient_role,
        ]);

        return $token->recipient_role;
    }

    public function approve(GuestFileRequest $request, User $user, ?string $rawToken = null): GuestFileRequest
    {
        return DB::transaction(function () use ($request, $user, $rawToken): GuestFileRequest {
            $locked = GuestFileRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            $role = $this->validatedActionRole($locked, $user, $rawToken);

            if ($locked->isActive()) {
                $locked->approve($role, $user);
                $this->consumeActionToken($locked, $role, $rawToken);
            }

            return $locked->fresh();
        });
    }

    public function reject(GuestFileRequest $request, User $user, ?string $reason = null, ?string $rawToken = null): GuestFileRequest
    {
        return DB::transaction(function () use ($request, $user, $reason, $rawToken): GuestFileRequest {
            $locked = GuestFileRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            $role = $this->validatedActionRole($locked, $user, $rawToken);

            if ($locked->isActive()) {
                $locked->reject($user, $reason);
                $this->consumeActionToken($locked, $role, $rawToken);
            }

            return $locked->fresh();
        });
    }

    protected function validatedActionRole(GuestFileRequest $request, User $user, ?string $rawToken = null): string
    {
        if (is_string($rawToken) && trim($rawToken) !== '') {
            $token = $this->findValidToken($request, $rawToken);
            if ($token && $this->canActAs($request, $user, $token->recipient_role)) {
                return $token->recipient_role;
            }

            throw new RuntimeException('You are not authorized to act on this request.');
        }

        if (!$request->isActive()) {
            if ($request->status === 'approved' && $request->adviser_approved_by === $user->id) {
                return $user->isMCIISStaff() ? 'staff' : 'adviser';
            }

            if ($request->status === 'rejected' && $request->rejected_by === $user->id) {
                return $user->isMCIISStaff() ? 'staff' : 'adviser';
            }
        }

        $sessionRequest = (int) session('file_access_review_request');
        $sessionRole = session('file_access_review_role');
        $sessionHash = session('file_access_review_token_hash');

        if ($sessionRequest === $request->id && is_string($sessionRole) && is_string($sessionHash)) {
            $token = $request->tokens()
                ->where('token_hash', $sessionHash)
                ->where('recipient_role', $sessionRole)
                ->first();

            if ($token
                && !$token->expires_at->isPast()
                && (!$token->used_at || !$request->isActive())
                && $this->canActAs($request, $user, $sessionRole)) {
                return $sessionRole;
            }
        }

        if ($user->isMCIISStaff() && $request->status === 'escalated') {
            return 'staff';
        }

        throw new RuntimeException('You are not authorized to act on this request.');
    }

    protected function consumeActionToken(GuestFileRequest $request, string $role, ?string $rawToken = null): void
    {
        $hash = is_string($rawToken) && trim($rawToken) !== ''
            ? hash('sha256', $rawToken)
            : session('file_access_review_token_hash');

        if (!is_string($hash)) {
            return;
        }

        $request->tokens()->where('token_hash', $hash)->where('recipient_role', $role)->whereNull('used_at')->update(['used_at' => now()]);

        if (is_string(session('file_access_review_token_hash'))
            && session('file_access_review_request') === $request->id
            && session('file_access_review_role') === $role) {
            session()->forget(['file_access_review_request', 'file_access_review_token_hash', 'file_access_review_role']);
        }
    }

    protected function findValidToken(GuestFileRequest $request, string $rawToken): ?GuestFileRequestToken
    {
        $hash = hash('sha256', $rawToken);

        return $request->tokens()
            ->where('token_hash', $hash)
            ->whereNull('used_at')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();
    }

    protected function canActAs(GuestFileRequest $request, User $user, string $role): bool
    {
        if ($role === 'lead') {
            return $request->research->researchers()
                ->where('is_lead_author', true)
                ->where('user_id', $user->id)
                ->exists();
        }

        if ($role === 'adviser') {
            return $request->research->adviser?->user?->is($user) === true
                || ($user->faculty && $request->research->research_adviser === $user->faculty->id);
        }

        return $role === 'staff' && $user->isMCIISStaff() && $request->status === 'escalated';
    }

    protected function usableRecipient(?User $user): bool
    {
        return $user !== null
            && $user->email_verified_at !== null
            && str_ends_with(strtolower($user->email), '@usep.edu.ph');
    }
}