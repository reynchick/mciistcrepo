<?php

namespace App\Console\Commands;

use App\Models\Research;
use Illuminate\Console\Command;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class SecureResearchManuscripts extends Command
{
    protected $signature = 'research:secure-manuscripts {--apply : Move verified manuscript files from public to private storage}';

    protected $description = 'Safely migrate legacy public manuscripts to private storage';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $hasIssues = false;
        $public = Storage::disk('public');
        $private = Storage::disk('private');

        Research::query()
            ->whereNotNull('research_manuscript')
            ->chunkById(100, function ($researches) use ($apply, $public, $private, &$hasIssues): void {
                foreach ($researches as $research) {
                    $path = $research->research_manuscript;
                    $inPublic = $public->exists($path);
                    $inPrivate = $private->exists($path);

                    if (!$inPublic && !$inPrivate) {
                        $this->error("Missing manuscript on both disks: research {$research->id} ({$path})");
                        $hasIssues = true;
                        continue;
                    }

                    if ($inPrivate) {
                        if ($inPublic && $this->fileHash($public, $path) !== $this->fileHash($private, $path)) {
                            $this->error("Conflicting copies; left unchanged: research {$research->id} ({$path})");
                            $hasIssues = true;
                            continue;
                        }

                        if ($inPublic && $apply && !$public->delete($path)) {
                            $this->error("Could not remove duplicate public copy: research {$research->id} ({$path})");
                            $hasIssues = true;
                            continue;
                        }

                        $this->line($inPublic
                            ? ($apply ? "Removed verified public duplicate: {$path}" : "Would remove verified public duplicate: {$path}")
                            : "Already private: {$path}");
                        continue;
                    }

                    if (!$apply) {
                        $this->line("Would move to private storage: {$path}");
                        continue;
                    }

                    if (!$this->moveAndVerify($public, $private, $path)) {
                        $this->error("Could not safely move manuscript: research {$research->id} ({$path})");
                        $hasIssues = true;
                        continue;
                    }

                    $this->info("Moved manuscript to private storage: {$path}");
                }
            });

        if (!$apply) {
            $this->comment('Dry run only. Re-run with --apply to move verified files and remove public copies.');
        }

        return $hasIssues ? self::FAILURE : self::SUCCESS;
    }

    private function moveAndVerify(FilesystemAdapter $public, FilesystemAdapter $private, string $path): bool
    {
        $source = $public->readStream($path);
        if (!is_resource($source)) {
            return false;
        }

        try {
            $sourceHash = $this->streamHash($source);
            rewind($source);

            if (!$private->put($path, $source)) {
                return false;
            }
        } finally {
            fclose($source);
        }

        if (!hash_equals($sourceHash, (string) $this->fileHash($private, $path))) {
            $private->delete($path);

            return false;
        }

        return $public->delete($path);
    }

    private function fileHash(FilesystemAdapter $disk, string $path): ?string
    {
        $stream = $disk->readStream($path);
        if (!is_resource($stream)) {
            return null;
        }

        try {
            return $this->streamHash($stream);
        } finally {
            fclose($stream);
        }
    }

    private function streamHash($stream): string
    {
        $context = hash_init('sha256');
        hash_update_stream($context, $stream);

        return hash_final($context);
    }
}
