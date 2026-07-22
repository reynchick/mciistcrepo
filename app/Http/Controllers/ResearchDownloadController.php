<?php

namespace App\Http\Controllers;

use App\Models\GuestFileRequest;
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
        if (!$request->user()) {
            $sessionId = $request->hasSession() ? $request->session()->getId() : null;
            $guestRequest = null;

            if ($request->filled('request_id')) {
                $guestRequest = GuestFileRequest::where('id', $request->input('request_id'))
                    ->where('research_id', $research->id)
                    ->where('status', 'approved')
                    ->where('file_type', 'manuscript')
                    ->first();
            }

            if (!$guestRequest && $sessionId) {
                $guestRequest = GuestFileRequest::where('research_id', $research->id)
                    ->where('guest_session_id', $sessionId)
                    ->where('status', 'approved')
                    ->where('file_type', 'manuscript')
                    ->latest()
                    ->first();
            }

            if (!$guestRequest) {
                $guestRequest = GuestFileRequest::where('research_id', $research->id)
                    ->where('status', 'approved')
                    ->where('file_type', 'manuscript')
                    ->latest()
                    ->first();
            }

            if (!$guestRequest) {
                return $this->error('Access denied.');
            }
        } else {
            $this->authorize('viewDetails', $research);
        }

        $response = $this->researchService->downloadPdf($research);
        if (!$response) {
            return $this->error('No manuscript file available.');
        }

        return $response;
    }

    /**
     * Download the approval sheet file if present.
     */
    public function downloadApprovalSheet(Request $request, Research $research): BinaryFileResponse|JsonResponse
    {
        if (!$request->user()) {
            $sessionId = $request->hasSession() ? $request->session()->getId() : null;
            $guestRequest = null;

            if ($request->filled('request_id')) {
                $guestRequest = GuestFileRequest::where('id', $request->input('request_id'))
                    ->where('research_id', $research->id)
                    ->where('status', 'approved')
                    ->where('file_type', 'approval_sheet')
                    ->first();
            }

            if (!$guestRequest && $sessionId) {
                $guestRequest = GuestFileRequest::where('research_id', $research->id)
                    ->where('guest_session_id', $sessionId)
                    ->where('status', 'approved')
                    ->where('file_type', 'approval_sheet')
                    ->latest()
                    ->first();
            }

            if (!$guestRequest) {
                $guestRequest = GuestFileRequest::where('research_id', $research->id)
                    ->where('status', 'approved')
                    ->where('file_type', 'approval_sheet')
                    ->latest()
                    ->first();
            }

            if (!$guestRequest) {
                return $this->error('Access denied.');
            }
        } else {
            $this->authorize('viewDetails', $research);
        }

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
