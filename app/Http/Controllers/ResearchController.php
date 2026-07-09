<?php
namespace App\Http\Controllers;


use App\Models\Research;
use App\Models\Program;
use App\Models\Faculty;
use App\Http\Actions\Research\ArchiveResearchAction;
use App\Http\Actions\Research\RestoreResearchAction;
use App\Repositories\ResearchRepository;
use App\Http\Requests\StoreResearchRequest;
use App\Http\Requests\UpdateResearchRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;


class ResearchController extends Controller
{
    public function __construct(
        protected ArchiveResearchAction $archiveAction,
        protected RestoreResearchAction $restoreAction,
        protected ResearchRepository $researchRepository,
    ) {
        $this->authorizeResource(Research::class);
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = $this->researchRepository->queryWithRelations();
        $filters = $request->only([
            'search', 'program', 'adviser', 'panelist', 'year', 'archived',
            'years', 'programs', 'advisers',
        ]);

        $this->researchRepository->applyFilters($query, $filters);

        $researches = $query->paginate(15)->withQueryString();


        return Inertia::render('research/index', [
            'researches' => $researches,
            'programs' => Program::select('id', 'name')->get(),
            'advisers' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->get(),
            'filters' => $request->only(['search', 'program', 'adviser', 'panelist', 'year', 'archived'])
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('research/create', [
            'programs' => Program::select('id', 'name')->get(),
            'advisers' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->get(),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreResearchRequest $request): RedirectResponse
    {
        $research = Research::create($request->safe()->except(['approval_sheet', 'manuscript']));
       
        if ($request->hasFile('approval_sheet') || $request->hasFile('manuscript')) {
            $research->uploadFiles(
                $request->file('approval_sheet'),
                $request->file('manuscript')
            );
        }


        return redirect()->route('research.show', $research)
            ->with('success', 'Research created successfully.');
    }


    /**
     * Display the specified resource.
     */
    public function show(Research $research): Response
    {
        $research->load([
            'program:id,name',
            'adviser:id,first_name,middle_name,last_name',
            'researchers:id,research_id,first_name,middle_name,last_name',
            'keywords:id,keyword_name',
            'uploader:id,first_name,last_name,email'
        ]);
       
        return Inertia::render('research/show', [
            'research' => $research
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Research $research): Response
    {
        $research->load(['researchers', 'keywords']);
       
        return Inertia::render('research/edit', [
            'research' => $research,
            'programs' => Program::select('id', 'name')->get(),
            'advisers' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->get(),
        ]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateResearchRequest $request, Research $research): RedirectResponse
    {
        $research->update($request->safe()->except(['approval_sheet', 'manuscript']));
       
        if ($request->hasFile('approval_sheet') || $request->hasFile('manuscript')) {
            $research->uploadFiles(
                $request->file('approval_sheet'),
                $request->file('manuscript')
            );
        }


        return redirect()->route('research.show', $research)
            ->with('success', 'Research updated successfully.');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Research $research): RedirectResponse
    {
        $research->delete();
       
        return redirect()->route('research.index')
            ->with('success', 'Research deleted successfully.');
    }


    public function archive(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('archive', $research);
        $request->validate([
            'reason' => 'required|string|max:500'
        ]);
        $this->archiveAction->execute($research, $request->reason, Auth::user());
        return redirect()->route('research.index')
            ->with('success', 'Research archived successfully.');
    }


    public function restore(Research $research): RedirectResponse
    {
        $this->authorize('restoreFromArchive', $research);
        $this->restoreAction->execute($research, Auth::user());
        return redirect()->route('research.index')
            ->with('success', 'Research restored successfully.');
    }

}


