<?php

use App\Models\Program;
use App\Models\Research;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('legacy public manuscripts remain untouched in dry-run and move only with apply', function () {
    Storage::fake('public');
    Storage::fake('private');
    $path = 'research/manuscripts/legacy.pdf';
    Storage::disk('public')->put($path, 'legacy manuscript');
    Research::factory()->create([
        'program_id' => Program::factory()->create()->id,
        'research_manuscript' => $path,
    ]);

    expect(Artisan::call('research:secure-manuscripts'))->toBe(0);
    Storage::disk('public')->assertExists($path);
    Storage::disk('private')->assertMissing($path);

    expect(Artisan::call('research:secure-manuscripts', ['--apply' => true]))->toBe(0);
    Storage::disk('public')->assertMissing($path);
    Storage::disk('private')->assertExists($path);
    expect(Storage::disk('private')->get($path))->toBe('legacy manuscript');
});
