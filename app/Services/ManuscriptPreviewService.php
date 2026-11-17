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
        $this->rasterizerExecutable();
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

        $relativePath = $this->cacheDirectory($research, $sourceHash).'/raw-page-'.$page.'.png';
        $disk = Storage::disk('private');
        if (!$disk->exists($relativePath)) {
            $rasterPath = $this->tempPngPath();

            try {
                $process = new Process([
                    $this->rasterizerExecutable(),
                    '-dSAFER',
                    '-dBATCH',
                    '-dNOPAUSE',
                    '-sDEVICE=png16m',
                    '-dTextAlphaBits=4',
                    '-dGraphicsAlphaBits=4',
                    '-r'.config('manuscript-preview.resolution'),
                    '-dFirstPage='.$page,
                    '-dLastPage='.$page,
                    '-sOutputFile='.$rasterPath,
                    $sourcePath,
                ]);
                $process->setTimeout((float) config('manuscript-preview.timeout_seconds'));
                $process->mustRun();

                $stream = fopen($rasterPath, 'rb');
                if ($stream === false) {
                    throw new RuntimeException('The manuscript page could not be read.');
                }

                try {
                    if (!$disk->put($relativePath, $stream)) {
                        throw new RuntimeException('The manuscript page could not be cached.');
                    }
                } finally {
                    fclose($stream);
                }
            } catch (\Throwable $exception) {
                throw new RuntimeException('The manuscript preview is unavailable.', 0, $exception);
            } finally {
                if (is_file($rasterPath)) {
                    unlink($rasterPath);
                }
            }
        }

        $watermarkedPath = $this->tempPngPath();
        try {
            if (!copy($disk->path($relativePath), $watermarkedPath)) {
                throw new RuntimeException('The manuscript page could not be prepared.');
            }

            $this->applyWatermark($watermarkedPath, $research);

            return $watermarkedPath;
        } catch (\Throwable $exception) {
            if (is_file($watermarkedPath)) {
                unlink($watermarkedPath);
            }
            throw new RuntimeException('The manuscript preview is unavailable.', 0, $exception);
        }
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

    private function rasterizerExecutable(): string
    {
        $configuredBinary = trim((string) config('manuscript-preview.rasterizer_binary'));
        if ($configuredBinary !== ''
            && is_file($configuredBinary)
            && (PHP_OS_FAMILY === 'Windows' || is_executable($configuredBinary))) {
            return $configuredBinary;
        }

        $binary = (new ExecutableFinder)->find($configuredBinary);
        if ($binary === null && PHP_OS_FAMILY === 'Windows') {
            $binary = $this->findWindowsGhostscript();
        }

        if ($binary === null) {
            throw new RuntimeException('The PDF preview renderer is not installed or configured. Set MANUSCRIPT_PREVIEW_RASTERIZER to the Ghostscript executable.');
        }

        return $binary;
    }

    private function findWindowsGhostscript(): ?string
    {
        $installRoots = array_filter([
            getenv('ProgramFiles') ?: null,
            getenv('ProgramFiles(x86)') ?: null,
        ]);
        $executables = [];

        foreach ($installRoots as $installRoot) {
            $matches = glob(rtrim($installRoot, '\\/').DIRECTORY_SEPARATOR.'gs'.DIRECTORY_SEPARATOR.'gs*'.DIRECTORY_SEPARATOR.'bin'.DIRECTORY_SEPARATOR.'gswin64c.exe');
            if ($matches !== false) {
                $executables = array_merge($executables, $matches);
            }
        }

        if ($executables === []) {
            return null;
        }

        natsort($executables);
        $latest = end($executables);

        return is_string($latest) && is_file($latest) ? $latest : null;
    }

    private function applyWatermark(string $imagePath, Research $research): void
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
            $brandFontSize = max(18, min(30, (int) floor($width / 40)));
            $restrictionFontSize = max(14, min(20, (int) floor($width / 60)));
            $citationFontSize = max(10, min(18, (int) floor($width / 80)));
            $angle = -35;
            $brandText = 'USeP MCIIS Repository Preview';
            $restrictionText = 'Download Restricted';
            $citationText = $this->citationText($research);

            $watermarks = [
                ['text' => $brandText, 'font_size' => $brandFontSize],
                ['text' => $restrictionText, 'font_size' => $restrictionFontSize],
            ];
            $stepY = max((int) ceil($brandFontSize * 5), (int) floor($height * 0.17));
            $color = imagecolorallocatealpha($image, 110, 110, 110, 96);

            for ($row = -1; $row <= (int) ceil($height / $stepY) + 1; $row++) {
                $watermark = $watermarks[abs($row) % count($watermarks)];
                $text = $watermark['text'];
                $fontSize = $watermark['font_size'];
                $bounds = imagettfbbox($fontSize, $angle, $fontPath, $text);
                if ($bounds === false) {
                    throw new RuntimeException('The manuscript preview watermark could not be created.');
                }

                $textWidth = $bounds[2] - $bounds[0];
                $stepX = max((int) ceil($textWidth * 1.15), (int) floor($width * 0.6));
                $rowOffset = $row % 2 === 0 ? 0 : (int) floor($stepX / 2);
                $y = (int) floor($height * 0.16) + ($row * $stepY);

                for ($x = -$textWidth + $rowOffset; $x < $width; $x += $stepX) {
                    if (imagettftext($image, $fontSize, $angle, $x, $y, $color, $fontPath, $text) === false) {
                        throw new RuntimeException('The manuscript preview watermark could not be applied.');
                    }
                }
            }

            $footerColor = imagecolorallocatealpha($image, 85, 85, 85, 80);
            $footerText = $citationText !== '' ? $citationText : 'Repository Preview';
            $footerBounds = imagettfbbox($citationFontSize, 0, $fontPath, $footerText);
            while ($footerBounds !== false && $footerBounds[2] - $footerBounds[0] > $width - 24 && mb_strlen($footerText) > 1) {
                $footerText = mb_substr($footerText, 0, -1);
                $footerBounds = imagettfbbox($citationFontSize, 0, $fontPath, $footerText);
            }
            if ($footerBounds !== false) {
                $footerWidth = $footerBounds[2] - $footerBounds[0];
                $footerX = max(12, (int) floor(($width - $footerWidth) / 2));
                $footerY = $height - 24;
                imagettftext($image, $citationFontSize, 0, $footerX, $footerY, $footerColor, $fontPath, $footerText);
            }

            if (!imagepng($image, $imagePath, 6)) {
                throw new RuntimeException('The manuscript preview watermark could not be applied.');
            }
        } finally {
            imagedestroy($image);
        }
    }

    private function citationText(?Research $research): string
    {
        $authors = $research->researchers()
            ->orderByDesc('is_lead_author')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn ($researcher) => trim((string) ($researcher->full_name ?? '')))
            ->filter()
            ->take(3)
            ->values()
            ->all();

        $authorText = $authors === [] ? 'Author(s) withheld' : implode(', ', $authors);
        $titleText = trim((string) $research->research_title);
        if ($titleText !== '') {
            $titleText = mb_strlen($titleText) > 90 ? mb_substr($titleText, 0, 87).'...' : $titleText;
        }

        $yearText = $research->completed_year ? (string) $research->completed_year : '';

        $parts = array_filter([
            $authorText,
            $titleText !== '' ? $titleText : null,
            $yearText !== '' ? $yearText : null,
        ], fn ($part) => $part !== null && $part !== '');

        return implode(' | ', $parts);
    }

    private function tempDirectory(): string
    {
        $directory = storage_path('app/temp/manuscript-preview');
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
            throw new RuntimeException('The manuscript preview could not be prepared.');
        }

        return $directory;
    }

    private function tempPngPath(): string
    {
        $path = tempnam($this->tempDirectory(), 'manuscript-page-');
        if ($path === false) {
            throw new RuntimeException('The manuscript preview could not be prepared.');
        }

        return $path;
    }
}