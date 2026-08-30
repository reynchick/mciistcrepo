<?php

namespace App\Http\Controllers;

use App\Models\GuestFileRequest;
use App\Models\GuestFileRequestAccessGrant;
use App\Models\Research;
use App\Services\ResearchExportService;
use App\Services\ResearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
    public function downloadPdf(Request $request, Research $research): BinaryFileResponse|JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->error('Authentication required.');
        }
        $hasApprovedRequest = GuestFileRequestAccessGrant::where('research_id', $research->id)
            ->where('guest_user_id', $user->id)
            ->where('file_type', 'manuscript')
            ->whereNull('revoked_at')
            ->exists();
        if (!$user->can('downloadFiles', $research) && !$hasApprovedRequest) {
            abort(403);
        }

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
     * Export research data to CSV.
     */
    public function export(): StreamedResponse
    {
        $this->authorize('export', Research::class);

        return $this->exportService->exportToCsv();
    }
}
