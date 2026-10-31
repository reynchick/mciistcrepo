<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        $publicDisk = Storage::disk('public');
        $privateDisk = Storage::disk('private');
        $paths = DB::table('researches')
            ->whereNotNull('research_manuscript')
            ->distinct()
            ->pluck('research_manuscript');

        foreach ($paths as $path) {
            if (!is_string($path) || !str_starts_with($path, 'research/') || str_contains($path, '..')) {
                continue;
            }

            if (!$publicDisk->exists($path)) {
                continue;
            }

            if (!$privateDisk->exists($path)) {
                $stream = $publicDisk->readStream($path);
                if (!is_resource($stream)) {
                    throw new RuntimeException('Unable to read a legacy research manuscript.');
                }

                try {
                    if (!$privateDisk->put($path, $stream)) {
                        throw new RuntimeException('Unable to move a legacy research manuscript to private storage.');
                    }
                } finally {
                    fclose($stream);
                }
            }

            if (!$publicDisk->delete($path)) {
                throw new RuntimeException('Unable to remove a legacy research manuscript from public storage.');
            }
        }
    }

    public function down(): void
    {
    }
};