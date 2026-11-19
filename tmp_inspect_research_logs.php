<?php

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (App\Models\ResearchEntryLog::query()
    ->latest()
    ->take(20)
    ->get(['id', 'modified_by', 'target_research_id', 'action_type', 'metadata', 'created_at']) as $log) {
    echo json_encode([
        'id' => $log->id,
        'actor_id' => $log->modified_by,
        'action' => $log->action_type,
        'snapshot' => data_get($log->metadata, 'actor_snapshot'),
        'created_at' => $log->created_at?->toDateTimeString(),
    ]).PHP_EOL;
}

foreach (App\Models\User::query()->with('roles:id,name')->whereIn('id', [1, 5, 7, 8, 9, 10, 13])->get() as $user) {
    echo json_encode([
        'user_id' => $user->id,
        'name' => $user->full_name,
        'roles' => $user->roles->pluck('name')->values(),
    ]).PHP_EOL;
}

Illuminate\Support\Facades\DB::beginTransaction();
session(['active_role' => 'Faculty']);
$verificationLog = App\Models\ResearchEntryLog::create([
    'modified_by' => 1,
    'target_research_id' => 1,
    'action_type' => App\Models\ResearchEntryLog::ACTION_POST,
    'metadata' => [],
]);
echo json_encode(['new_log_snapshot_verification' => data_get($verificationLog->metadata, 'actor_snapshot')]).PHP_EOL;
$verificationLog = App\Models\ResearchEntryLog::create([
    'modified_by' => 1,
    'target_research_id' => 1,
    'action_type' => App\Models\ResearchEntryLog::ACTION_ARCHIVE,
    'metadata' => [],
]);
session(['active_role' => 'MCIIS Staff']);
$verificationLog = App\Models\ResearchEntryLog::create([
    'modified_by' => 1,
    'target_research_id' => 1,
    'action_type' => App\Models\ResearchEntryLog::ACTION_ARCHIVE,
    'metadata' => [],
]);
echo json_encode(['new_staff_log_snapshot_verification' => data_get($verificationLog->metadata, 'actor_snapshot')]).PHP_EOL;
Illuminate\Support\Facades\DB::rollBack();
