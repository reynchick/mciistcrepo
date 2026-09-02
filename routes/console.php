<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\User;
use App\Models\GuestFileRequest;
use App\Services\FileAccessRequestWorkflowService;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('users:restore {id}', function () {
    $id = $this->argument('id');
    $user = User::withTrashed()->find($id);

    if (!$user) {
        $this->error("User not found with ID: {$id}");
        return;
    }

    if (!$user->trashed()) {
        $this->warn("User is not deleted: {$user->email}");
        return;
    }

    $user->restore();
    $this->info("User restored successfully: {$user->email}");
})->purpose('Restore a soft-deleted user by ID');

Artisan::command('users:purge-soft-deleted {--days=90}', function () {
    $days = (int) $this->option('days');
    $cutoff = now()->subDays($days);

    $this->info("Purging soft-deleted users older than {$days} day(s) (cutoff: {$cutoff->toDateTimeString()})...");

    $count = User::onlyTrashed()
        ->where('deleted_at', '<', $cutoff)
        ->chunkById(200, function ($users) {
            $users->each->forceDelete();
        });

    $this->info('Purge complete.');
})->purpose('Permanently remove soft-deleted users older than N days');

// Scheduled cleanup: purge soft-deleted users after 365 days (1 year)
Schedule::command('users:purge-soft-deleted --days=365')->monthlyOn(1, '02:00');

Artisan::command('file-access-requests:process', function (FileAccessRequestWorkflowService $workflow) {
    GuestFileRequest::active()->where(function ($query): void {
        $query->whereNotNull('expires_at')->where('expires_at', '<=', now())
            ->orWhere(function ($query): void {
                $query->whereNull('escalated_at')->where('created_at', '<=', now()->subDays(7));
            });
    })->pluck('id')->each(function (int $id) use ($workflow): void {
        $escalated = false;
        $expired = false;
        DB::transaction(function () use ($id, &$escalated, &$expired): void {
            $request = GuestFileRequest::whereKey($id)->lockForUpdate()->first();
            if (!$request || !$request->isActive()) {
                return;
            }
            if ($request->expires_at && $request->expires_at->isPast()) {
                $request->expire();
                $expired = true;
                return;
            }
            if (!$request->escalated_at && $request->created_at->lte(now()->subDays(7))) {
                $request->escalate();
                $escalated = true;
            }
        });
        if ($escalated) {
            $workflow->queueEscalationNotifications(GuestFileRequest::findOrFail($id));
        }
        if ($expired) {
            $workflow->queueExpirationNotification(GuestFileRequest::findOrFail($id));
        }
    });
})->purpose('Escalate and expire unresolved file access requests');

Schedule::command('file-access-requests:process')->daily();
