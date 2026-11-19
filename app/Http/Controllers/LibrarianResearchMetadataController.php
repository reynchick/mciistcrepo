<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateResearchMetadataRequest;
use App\Models\Research;
use App\Models\Program;
use App\Models\Faculty;
use App\Models\Keyword;
use App\Models\Agenda;
use App\Models\Sdg;
use App\Models\Srig;
use App\Services\ResearchMetadataService;
use App\Services\ResearchService;
use App\Services\ResearchAuditSnapshotService;
use App\Observers\ResearchObserver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibrarianResearchMetadataController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $validStatuses = array_keys(config('research.statuses', []));

        if ($status === 'all' || ! in_array($status, $validStatuses, true)) {
            $status = '';
        }

        $parseIds = static function ($values, int $legacyValue): array {
            $ids = array_values(array_unique(array_filter(
                array_map('intval', is_array($values) ? $values : []),
                static fn (int $id): bool => $id > 0,
            )));

            if ($ids === [] && $legacyValue > 0) {
                $ids[] = $legacyValue;
            }

            return $ids;
        };
        $programIds = $parseIds($request->input('programs'), $request->integer('program'));
        $adviserIds = $parseIds($request->input('advisers'), $request->integer('adviser'));
        $years = $parseIds($request->input('years'), $request->integer('year'));

        $researches = Research::query()
            ->with([
                'program:id,name,code',
                'adviser:id,first_name,middle_name,last_name',
                'researchers:id,research_id,first_name,middle_name,last_name,is_lead_author',
                'metadataValues:id,research_id,term,value,scheme,sort_order',
                'keywords:id,keyword_name',
                'agendas:id,name',
                'sdgs:id,name',
                'srigs:id,name',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('research_title', 'like', "%{$search}%")
                        ->orWhere('id', $search);
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($programIds !== [], fn ($query) => $query->whereIn('program_id', $programIds))
            ->when($adviserIds !== [], fn ($query) => $query->whereIn('research_adviser', $adviserIds))
            ->when($years !== [], fn ($query) => $query->whereIn('completed_year', $years))
            ->orderBy('created_at')
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString();

        $researches->getCollection()->each(function (Research $research) use ($request): void {
            $research->setAttribute(
                'can_view_activity',
                $request->user() !== null && $request->user()->can('view', $research),
            );
        });

        return Inertia::render('librarian/research/index', [
            'researches' => $researches,
            'filters' => [
                'search' => $search,
                'status' => $status !== '' ? $status : 'all',
                'programs' => $programIds,
                'advisers' => $adviserIds,
                'years' => $years,
            ],
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            'faculties' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->get(),
            'yearOptions' => Research::query()
                ->whereNotNull('completed_year')
                ->distinct()
                ->orderBy('completed_year')
                ->pluck('completed_year')
                ->values(),
            'keywordOptions' => Keyword::select('id', 'keyword_name')->orderBy('keyword_name')->get(),
            'agendas' => Agenda::select('id', 'name')->orderBy('name')->get(),
            'sdgs' => Sdg::select('id', 'name')->orderBy('name')->get(),
            'srigs' => Srig::select('id', 'name')->orderBy('name')->get(),
            'metadataTerms' => \App\Models\ResearchMetadataValue::TERMS,
        ]);
    }

    public function edit(Request $request, Research $research): Response
    {
        $this->authorize('viewMetadata', $research);

        $research->load(['researchers', 'metadataValues', 'program', 'adviser', 'keywords', 'agendas', 'sdgs', 'srigs']);

        return Inertia::render('librarian/research/edit', [
            'research' => $research,
            'canViewActivity' => $request->user()?->can('view', $research) ?? false,
            'terms' => \App\Models\ResearchMetadataValue::TERMS,
        ]);
    }

    public function update(
        UpdateResearchMetadataRequest $request,
        Research $research,
        ResearchMetadataService $metadataService,
        ResearchService $researchService,
        ResearchAuditSnapshotService $auditSnapshots,
    ): RedirectResponse {
        $this->authorize('viewMetadata', $research);

        $userId = $request->user()->id;
        $metadata = $request->validated('metadata', []);
        $creatorNames = collect($metadata)
            ->where('term', 'creator')
            ->pluck('value')
            ->map(fn (string $value): string => trim($value))
            ->filter()
            ->values();
        $creatorIds = $research->researchers()
            ->get()
            ->filter(fn ($researcher): bool => $creatorNames->contains($researcher->full_name))
            ->pluck('id')
            ->all();

        $oldSnapshot = $auditSnapshots->capture($research);
        $user = $request->user();

        ResearchObserver::withoutAuditLogging(function () use (
            $metadataService,
            $researchService,
            $research,
            $metadata,
            $creatorIds,
            $userId,
            $request,
            $user,
        ): void {
            $metadataService->replaceValues($research, $metadata, $userId);
            $metadataService->replaceCreators($research, $creatorIds, $userId);

            $location = trim((string) $request->validated('physical_attributes.hardboundLocation'));
            $unavailable = $request->exists('physical_unavailable')
                ? $request->boolean('physical_unavailable')
                : $request->input('physical_attributes.physicalAvailability') === false
                    || $request->input('physical_attributes.physicalAvailability') === 0
                    || $request->input('physical_attributes.physicalAvailability') === '0';

            $research->forceFill([
                'physical_attributes' => [
                    'hardboundLocation' => $location !== '' ? $location : null,
                    'physicalAvailability' => $location !== '' && ! $unavailable,
                ],
            ])->save();

            if ($request->hasFile('research_manuscript') || $request->boolean('clear_research_manuscript')) {
                $researchService->syncFiles(
                    $research,
                    $request->file('research_manuscript'),
                    $request->boolean('clear_research_manuscript'),
                );
            }

            $research->forceFill([
                'manuscript_unavailable_legacy_at' => $request->boolean('manuscript_unavailable') ? now() : null,
                'manuscript_unavailable_legacy_by' => $request->boolean('manuscript_unavailable') ? $user->id : null,
            ])->save();
        });

        $updatedResearch = $research->fresh();
        $auditSnapshots->recordChanges(
            $updatedResearch,
            $oldSnapshot,
            $auditSnapshots->capture($updatedResearch),
            $user,
            'librarian_metadata_edit',
        );

        return to_route('librarian.research.index')
            ->with('success', 'Update saved successfully.');
    }
}
