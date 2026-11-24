<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\User;

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
