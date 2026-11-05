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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibrarianResearchMetadataController extends Controller
{
    public function index(Request $request): Response
    {
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
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = trim((string) $request->input('search'));
                $query->where(function ($query) use ($search): void {
                    $query->where('research_title', 'like', "%{$search}%")
                        ->orWhere('id', $search);
                });
            })
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('librarian/research/index', [
            'researches' => $researches,
            'filters' => ['search' => (string) $request->input('search', '')],
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            'faculties' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->get(),
            'keywordOptions' => Keyword::select('id', 'keyword_name')->orderBy('keyword_name')->get(),
            'agendas' => Agenda::select('id', 'name')->orderBy('name')->get(),
            'sdgs' => Sdg::select('id', 'name')->orderBy('name')->get(),
            'srigs' => Srig::select('id', 'name')->orderBy('name')->get(),
            'metadataTerms' => \App\Models\ResearchMetadataValue::TERMS,
        ]);
    }

    public function edit(Research $research): Response
    {
        $this->authorize('viewMetadata', $research);

        $research->load(['researchers', 'metadataValues', 'program', 'adviser', 'keywords', 'agendas', 'sdgs', 'srigs']);

        return Inertia::render('librarian/research/edit', [
            'research' => $research,
            'terms' => \App\Models\ResearchMetadataValue::TERMS,
        ]);
    }

    public function update(
        UpdateResearchMetadataRequest $request,
        Research $research,
        ResearchMetadataService $metadataService
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

        $metadataService->replaceValues($research, $metadata, $userId);
        $metadataService->replaceCreators($research, $creatorIds, $userId);

        $research->forceFill([
            'physical_attributes' => [
                'hardboundLocation' => $request->validated('physical_attributes.hardboundLocation'),
                'physicalAvailability' => (bool) $request->validated('physical_attributes.physicalAvailability'),
            ],
        ])->save();

        return to_route('librarian.research.index')
            ->with('success', 'Update saved successfully.');
    }
}
