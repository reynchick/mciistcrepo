<?php

namespace App\Services;

use App\Models\Research;
use RuntimeException;

class ManuscriptPreviewWatermarkService
{
    public function apply(string $imagePath, Research $research): void
    {
        if (! function_exists('imagettftext')) {
            throw new RuntimeException('GD FreeType support is required for manuscript previews.');
        }

        $image = imagecreatefrompng($imagePath);
        if ($image === false) {
            throw new RuntimeException('The manuscript page could not be rendered.');
        }

        $fontPath = config('manuscript-preview.font_path');
        if (! is_file($fontPath)) {
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
            while ($footerBounds !== false && $width - 24 < $footerBounds[2] - $footerBounds[0] && mb_strlen($footerText) > 1) {
                $footerText = mb_substr($footerText, 0, -1);
                $footerBounds = imagettfbbox($citationFontSize, 0, $fontPath, $footerText);
            }
            if ($footerBounds !== false) {
                $footerWidth = $footerBounds[2] - $footerBounds[0];
                $footerX = max(12, (int) floor(($width - $footerWidth) / 2));
                $footerY = $height - 24;
                imagettftext($image, $citationFontSize, 0, $footerX, $footerY, $footerColor, $fontPath, $footerText);
            }

            if (! imagepng($image, $imagePath, 6)) {
                throw new RuntimeException('The manuscript preview watermark could not be applied.');
            }
        } finally {
            imagedestroy($image);
        }
    }

    private function citationText(Research $research): string
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
}
