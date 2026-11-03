<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateResearchMetadataRequest;
use App\Models\Research;
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
            ->with(['program:id,name,code'])
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
        ]);
    }

    public function edit(Research $research): Response
    {
        $this->authorize('viewMetadata', $research);

        $research->load(['researchers', 'metadataValues', 'program', 'adviser']);

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
        $metadataService->replaceValues($research, $request->validated('metadata', []), $userId);
        $metadataService->replaceCreators($research, $request->validated('creator_ids', []), $userId);

        $research->forceFill([
            'physical_attributes' => [
                'hardboundLocation' => $request->validated('physical_attributes.hardboundLocation'),
                'physicalAvailability' => (bool) $request->validated('physical_attributes.physicalAvailability'),
            ],
        ])->save();

        return to_route('librarian.research.metadata.edit', $research)
            ->with('success', 'Dublin Core metadata was saved.');
    }
}
