<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Services\ManuscriptPreviewService;
use App\Services\ResearchExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    public function previewInfo(Request $request, Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        try {
            $previewedAt = now()->utc()->toIso8601String();
            $request->session()->put($this->previewSessionKey($research), $previewedAt);

            return response()->json([
                'page_count' => $this->manuscriptPreviewService->pageCount($research),
            ]);
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }
    }

    public function previewPage(Request $request, Research $research, int $page): BinaryFileResponse
    {
        $this->authorize('view', $research);
        if (!is_string($request->session()->get($this->previewSessionKey($research)))) {
            abort(410, 'Open the manuscript preview again to continue.');
        }

        try {
            $imagePath = $this->manuscriptPreviewService->pageImage($research, $page);
        } catch (InvalidArgumentException) {
            abort(404);
        } catch (RuntimeException) {
            abort(422, 'The manuscript preview is unavailable.');
        }

        $response = response()->file($imagePath, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'inline; filename="research-page-'.$page.'.png"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
        $response->setPrivate();
        $response->headers->addCacheControlDirective('no-store');

        return $response->deleteFileAfterSend(true);
    }

    /**
     * Export research data to CSV.
     */
    public function export(): StreamedResponse
    {
        $this->authorize('export', Research::class);

        return $this->exportService->exportToCsv();
    }

    private function previewSessionKey(Research $research): string
    {
        return 'manuscript-preview.'.$research->getKey().'.started_at';
    }
}
