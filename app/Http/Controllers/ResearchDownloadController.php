<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Services\ResearchExportService;
use App\Services\ResearchService;
use Illuminate\Http\JsonResponse;
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
    public function downloadPdf(Research $research): BinaryFileResponse|JsonResponse
    {
        $this->authorize('viewDetails', $research);

        $response = $this->researchService->downloadPdf($research);
        if (!$response) {
            return $this->error('No manuscript file available.');
        }

        return $response;
    }

    /**
     * Download the approval sheet file if present.
     */
    public function downloadApprovalSheet(Research $research): BinaryFileResponse|JsonResponse
    {
        $this->authorize('viewDetails', $research);

        $response = $this->researchService->downloadApprovalSheet($research);
        if (!$response) {
            return $this->error('No approval sheet file available.');
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
