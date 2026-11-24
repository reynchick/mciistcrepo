<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Services\ManuscriptPreviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ManuscriptPreviewController extends Controller
{
    public function metadata(Research $research, ManuscriptPreviewService $previewService): JsonResponse
    {
        $this->authorize('view', $research);

        try {
            return response()->json(['page_count' => $previewService->pageCount($research)]);
        } catch (RuntimeException $exception) {
            return $this->previewError($exception);
        }
    }

    public function page(
        Research $research,
        int $page,
        ManuscriptPreviewService $previewService,
    ): JsonResponse|BinaryFileResponse {
        $this->authorize('view', $research);

        try {
            $imagePath = $previewService->pageImage($research, $page);
        } catch (\InvalidArgumentException) {
            abort(404);
        } catch (RuntimeException $exception) {
            return $this->previewError($exception);
        }

        $response = response()->file($imagePath, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => sprintf('inline; filename="research-page-%d.png"', $page),
        ]);
        $response->setPrivate();
        $response->headers->set('Cache-Control', 'no-store, private');

        return $response->deleteFileAfterSend(true);
    }

    private function previewError(RuntimeException $exception): JsonResponse
    {
        $message = $exception->getMessage();
        $status = Str::contains($message, 'renderer is not installed')
            ? 503
            : ($message === 'The manuscript is unavailable.' ? 410 : 422);

        return response()->json(['message' => $message], $status);
    }
}
