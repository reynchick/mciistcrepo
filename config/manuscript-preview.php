<?php

return [
    'rasterizer_binary' => env(
        'MANUSCRIPT_PREVIEW_RASTERIZER',
        PHP_OS_FAMILY === 'Windows' ? 'gswin64c.exe' : 'gs',
    ),
    'resolution' => (int) env('MANUSCRIPT_PREVIEW_RESOLUTION', 144),
    'max_pages' => (int) env('MANUSCRIPT_PREVIEW_MAX_PAGES', 300),
    'max_file_bytes' => (int) env('MANUSCRIPT_PREVIEW_MAX_FILE_BYTES', 104857600),
    'timeout_seconds' => (int) env('MANUSCRIPT_PREVIEW_TIMEOUT', 60),
    'font_path' => base_path('vendor/mpdf/mpdf/ttfonts/DejaVuSans.ttf'),
];