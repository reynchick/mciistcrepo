<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Services\ManuscriptPreviewService;
use App\Services\ResearchExportService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use RuntimeException;

class ResearchDownloadController extends Controller
{
    public function __construct(
        protected ResearchExportService $exportService,
        protected ManuscriptPreviewService $manuscriptPreviewService,
    ) {
    }

    /**
     * Manuscript retrieval is disabled for all users.
     */
    public function downloadPdf(Research $research)
    {
        abort(403, 'Manuscript downloads are disabled.');
    }

    public function previewInfo(Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        try {
            return response()->json([
                'page_count' => $this->manuscriptPreviewService->pageCount($research),
            ]);
        } catch (RuntimeException) {
            return response()->json(['message' => 'The manuscript preview is unavailable.'], 422);
        }
    }

    public function previewPage(Research $research, int $page): BinaryFileResponse
    {
        $this->authorize('view', $research);

        try {
            $imagePath = $this->manuscriptPreviewService->pageImage($research, $page);
        } catch (InvalidArgumentException) {
            abort(404);
        } catch (RuntimeException) {
            abort(422, 'The manuscript preview is unavailable.');
        }

        return response()->file($imagePath, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'inline; filename="research-page-'.$page.'.png"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Export research data to CSV.
     */
    public function export(): StreamedResponse
    {
        $this->authorize('export', Research::class);

        return $this->exportService->exportToCsv();
    }
}
