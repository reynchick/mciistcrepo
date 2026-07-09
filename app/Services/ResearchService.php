<?php

namespace App\Services;

use App\Models\Research;
use App\Models\Program;
use App\Models\Faculty;
use App\Models\ResearchAccessLog;
use App\Repositories\ResearchRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ResearchService
{
    public function __construct(
        protected ResearchRepository $researchRepository,
    ) {}
    /**
     * Handle file uploads.
     */
    public function uploadFiles($research, $approvalSheet, $manuscript)
    {
        if ($approvalSheet) {
            if ($research->research_approval_sheet) {
                Storage::disk('public')->delete($research->research_approval_sheet);
            }
            $approvalSheetPath = $approvalSheet->store('research/approval_sheets', 'public');
            $research->research_approval_sheet = $approvalSheetPath;
        }
        if ($manuscript) {
            if ($research->research_manuscript) {
                Storage::disk('public')->delete($research->research_manuscript);
            }
            $manuscriptPath = $manuscript->store('research/manuscripts', 'public');
            $research->research_manuscript = $manuscriptPath;
        }
        $research->save();
    }

    public function getApprovalSheetUrl($research)
    {
        return $research->research_approval_sheet ? Storage::url($research->research_approval_sheet) : null;
    }

    public function getManuscriptUrl($research)
    {
        return $research->research_manuscript ? Storage::url($research->research_manuscript) : null;
    }

    public function attachKeywords($research, array $keywordIds): void
    {
        $oldKeywords = $research->keywords()->pluck('keywords.id')->toArray();
        $research->keywords()->sync($keywordIds);
        $newKeywords = $research->keywords()->pluck('keywords.id')->toArray();
        $added = array_diff($newKeywords, $oldKeywords);
        $removed = array_diff($oldKeywords, $newKeywords);
        if (!empty($added) || !empty($removed)) {
            $research->logAudit('synced', null, [
                'relation' => 'keywords',
                'added' => $added,
                'removed' => $removed
            ]);
        }
    }

    public function attachPanelists($research, array $facultyIds): void
    {
        $oldPanelists = $research->panelists()->pluck('faculty.id')->toArray();
        $research->panelists()->sync($facultyIds);
        $newPanelists = $research->panelists()->pluck('faculty.id')->toArray();
        $added = array_diff($newPanelists, $oldPanelists);
        $removed = array_diff($oldPanelists, $newPanelists);
        if (!empty($added) || !empty($removed)) {
            $research->logAudit('synced', null, [
                'relation' => 'panelists',
                'added' => $added,
                'removed' => $removed
            ]);
        }
    }

    // --- Moved controller logic below ---
    public function archive(Research $research, $user, string $reason): void
    {
        $research->archive($user, $reason);
    }

    public function restore(Research $research): void
    {
        $research->restore();
    }

    public function downloadPdf(Research $research): ?BinaryFileResponse
    {
        if (!$research->research_manuscript) {
            return null;
        }
        return response()->download(
            Storage::disk('public')->path($research->research_manuscript),
            $research->research_title . '.pdf'
        );
    }

    public function downloadApprovalSheet(Research $research): ?BinaryFileResponse
    {
        if (!$research->research_approval_sheet) {
            return null;
        }
        return response()->download(
            Storage::disk('public')->path($research->research_approval_sheet),
            $research->research_title . '-approval-sheet.pdf'
        );
    }

    public function browse(array $filters, int $perPage = 12)
    {
        $allowed = [12, 24, 48, 96];
        if (!in_array($perPage, $allowed, true)) {
            $perPage = 12;
        }
        return $this->researchRepository->paginateFiltered($filters, $perPage);
    }

    public function details(Research $research): array
    {
        $research->load([
            'program:id,name,code',
            'adviser:id,first_name,middle_name,last_name',
            'researchers:id,research_id,first_name,middle_name,last_name',
            'panelists:id,first_name,middle_name,last_name',
            'keywords:id,keyword_name'
        ]);

        return [
            'id' => $research->id,
            'research_title' => $research->research_title,
            'program' => [
                'id' => $research->program?->id,
                'name' => $research->program?->name,
                'code' => $research->program?->code ?? null,
            ],
            'published_month' => $research->published_month,
            'published_year' => $research->published_year,
            'research_abstract' => $research->research_abstract,
            'research_approval_sheet' => $research->research_approval_sheet,
            'research_manuscript' => $research->research_manuscript,
            'adviser' => [
                'id' => $research->adviser?->id,
                'name' => $research->adviser?->full_name ?? null,
            ],
            'researchers' => $research->researchers
                ->map(function ($r) {
                    $name = collect([$r->first_name, $r->middle_name, $r->last_name])
                        ->filter()
                        ->join(' ');
                    return [
                        'id' => $r->id,
                        'name' => $name,
                    ];
                })
                ->values(),
            'panelists' => $research->panelists->map(fn($p) => [
                'id' => $p->id,
                'name' => collect([$p->first_name, $p->middle_name, $p->last_name])
                    ->filter()
                    ->join(' '),
            ])->values(),
            'keywords' => $research->keywords->map(fn($k) => [
                'id' => $k->id,
                'keyword_name' => $k->keyword_name,
            ])->values(),
        ];
    }

    public function logAccess(Research $research, $userId, $ip, $userAgent): void
    {
        $recentExists = ResearchAccessLog::where('research_id', $research->id)
            ->where('user_id', $userId)
            ->where('created_at', '>=', now()->subMinutes(5))
            ->exists();
        if (!$recentExists) {
            ResearchAccessLog::create([
                'research_id' => $research->id,
                'user_id' => $userId,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
            ]);
        }
    }
}
