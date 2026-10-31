<?php

namespace App\Services;

use App\Models\Research;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Smalot\PdfParser\Parser;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

class ManuscriptPreviewService
{
    public function pageCount(Research $research): int
    {
        [$sourcePath, $sourceHash] = $this->source($research);
        $cacheDirectory = $this->cacheDirectory($research, $sourceHash);
        $manifestPath = $cacheDirectory.'/manifest.json';
        $disk = Storage::disk('private');

        if ($disk->exists($manifestPath)) {
            $manifest = json_decode($disk->get($manifestPath), true);
            $pageCount = is_array($manifest) ? (int) ($manifest['page_count'] ?? 0) : 0;
            if ($pageCount > 0 && $pageCount <= config('manuscript-preview.max_pages')) {
                return $pageCount;
            }
        }

        try {
            $pageCount = count((new Parser)->parseFile($sourcePath)->getPages());
        } catch (\Throwable $exception) {
            throw new RuntimeException('The manuscript cannot be previewed.', 0, $exception);
        }

        if ($pageCount < 1 || $pageCount > config('manuscript-preview.max_pages')) {
            throw new RuntimeException('The manuscript exceeds preview limits.');
        }

        $disk->put($manifestPath, json_encode(['page_count' => $pageCount], JSON_THROW_ON_ERROR));

        return $pageCount;
    }

    public function pageImage(Research $research, int $page): string
    {
        [$sourcePath, $sourceHash] = $this->source($research);
        $pageCount = $this->pageCount($research);

        if ($page < 1 || $page > $pageCount) {
            throw new \InvalidArgumentException('The requested page does not exist.');
        }

        $relativePath = $this->cacheDirectory($research, $sourceHash).'/page-'.$page.'.png';
        $disk = Storage::disk('private');
        if ($disk->exists($relativePath)) {
            return $disk->path($relativePath);
        }

        $tempPath = tempnam($this->tempDirectory(), 'manuscript-page-');
        if ($tempPath === false) {
            throw new RuntimeException('The manuscript preview could not be prepared.');
        }

        try {
            $rasterizer = (new ExecutableFinder)->find((string) config('manuscript-preview.rasterizer_binary'));
            if ($rasterizer === null) {
                throw new RuntimeException('The PDF rasterizer is not installed.');
            }

            $process = new Process([
                $rasterizer,
                '-dSAFER',
                '-dBATCH',
                '-dNOPAUSE',
                '-sDEVICE=png16m',
                '-dTextAlphaBits=4',
                '-dGraphicsAlphaBits=4',
                '-r'.config('manuscript-preview.resolution'),
                '-dFirstPage='.$page,
                '-dLastPage='.$page,
                '-sOutputFile='.$tempPath,
                $sourcePath,
            ]);
            $process->setTimeout((float) config('manuscript-preview.timeout_seconds'));
            $process->mustRun();

            $this->applyWatermark($tempPath);

            $stream = fopen($tempPath, 'rb');
            if ($stream === false) {
                throw new RuntimeException('The manuscript preview could not be read.');
            }

            try {
                if (!$disk->put($relativePath, $stream)) {
                    throw new RuntimeException('The manuscript preview could not be cached.');
                }
            } finally {
                fclose($stream);
            }
        } catch (\Throwable $exception) {
            throw new RuntimeException('The manuscript preview is unavailable.', 0, $exception);
        } finally {
            if (is_file($tempPath)) {
                unlink($tempPath);
            }
        }

        return $disk->path($relativePath);
    }

    public function clearCache(Research $research): void
    {
        Storage::disk('private')->deleteDirectory('research/previews/'.$research->id);
    }

    private function source(Research $research): array
    {
        $path = $research->research_manuscript;
        $disk = Storage::disk('private');

        if (!$path || !$disk->exists($path)) {
            throw new RuntimeException('The manuscript is unavailable.');
        }

        $sourcePath = $disk->path($path);
        if (filesize($sourcePath) > config('manuscript-preview.max_file_bytes')) {
            throw new RuntimeException('The manuscript exceeds preview limits.');
        }

        $sourceHash = hash_file('sha256', $sourcePath);
        if (!is_string($sourceHash)) {
            throw new RuntimeException('The manuscript is unavailable.');
        }

        return [$sourcePath, $sourceHash];
    }

    private function cacheDirectory(Research $research, string $sourceHash): string
    {
        return 'research/previews/'.$research->id.'/'.$sourceHash;
    }

    private function applyWatermark(string $imagePath): void
    {
        if (!function_exists('imagettftext')) {
            throw new RuntimeException('GD FreeType support is required for manuscript previews.');
        }

        $image = imagecreatefrompng($imagePath);
        if ($image === false) {
            throw new RuntimeException('The manuscript page could not be rendered.');
        }

        $fontPath = config('manuscript-preview.font_path');
        if (!is_file($fontPath)) {
            imagedestroy($image);
            throw new RuntimeException('The manuscript preview watermark font is unavailable.');
        }

        try {
            $width = imagesx($image);
            $height = imagesy($image);
            $fontSize = max(24, min(64, (int) floor($width / 18)));
            $angle = -35;
            $text = 'For USeP-CIC Use Only';
            $bounds = imagettfbbox($fontSize, $angle, $fontPath, $text);
            if ($bounds === false) {
                throw new RuntimeException('The manuscript preview watermark could not be created.');
            }

            $textWidth = $bounds[2] - $bounds[0];
            $x = (int) floor(($width - $textWidth) / 2);
            $y = (int) floor($height / 2);
            $color = imagecolorallocatealpha($image, 110, 110, 110, 114);
            if (imagettftext($image, $fontSize, $angle, $x, $y, $color, $fontPath, $text) === false
                || !imagepng($image, $imagePath, 6)) {
                throw new RuntimeException('The manuscript preview watermark could not be applied.');
            }
        } finally {
            imagedestroy($image);
        }
    }

    private function tempDirectory(): string
    {
        $directory = storage_path('app/temp/manuscript-preview');
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new RuntimeException('The manuscript preview could not be prepared.');
        }

        return $directory;
    }
}