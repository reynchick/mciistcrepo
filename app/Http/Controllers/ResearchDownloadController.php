<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Services\ResearchExportService;
use App\Services\ResearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ResearchDownloadController extends Controller
{
    public function __construct(
        protected ResearchService $researchService,
        protected ResearchExportService $exportService,
    ) {
    }

    /**
     * Download the manuscript PDF file if available.
     */
    public function downloadPdf(Research $research): BinaryFileResponse|HttpResponse|JsonResponse
    {
        $this->authorize('viewDetails', $research);

        $response = $this->researchService->downloadPdf($research);
        if (!$response) {
            return response()->view('research.file-unavailable', [
                'title' => 'Manuscript',
                'message' => 'File not available - please re-upload.',
                'backUrl' => url()->previous(),
            ], 410);
        }

        return $response;
    }

    /**
     * Download the approval sheet file if present.
     */
    public function downloadApprovalSheet(Research $research): BinaryFileResponse|HttpResponse|JsonResponse
    {
        $this->authorize('viewDetails', $research);

        $response = $this->researchService->downloadApprovalSheet($research);
        if (!$response) {
            return response()->view('research.file-unavailable', [
                'title' => 'Approval Sheet',
                'message' => 'File not available - please re-upload.',
                'backUrl' => url()->previous(),
            ], 410);
        }

        return $response;
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
