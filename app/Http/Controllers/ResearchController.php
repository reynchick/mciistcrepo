<?php
namespace App\Http\Controllers;


use App\Models\Research;
use App\Models\Program;
use App\Models\Faculty;
use App\Models\Keyword;
use App\Models\Agenda;
use App\Models\Sdg;
use App\Models\Srig;
use App\Http\Actions\Research\ArchiveResearchAction;
use App\Http\Actions\Research\RestoreResearchAction;
use App\Repositories\ResearchRepository;
use App\Services\ResearchService;
use App\Http\Requests\StoreResearchRequest;
use App\Http\Requests\UpdateResearchRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;


class ResearchController extends Controller
{
    public function __construct(
        protected ArchiveResearchAction $archiveAction,
        protected RestoreResearchAction $restoreAction,
        protected ResearchRepository $researchRepository,
        protected ResearchService $researchService,
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
        $data = $request->safe()->except([
            'research_approval_sheet', 'research_manuscript', 'keywords', 'researchers', 'panelists', 'agendas', 'sdgs', 'srigs',
        ]);

        $research = Research::create($data);

        if ($request->hasFile('research_approval_sheet') || $request->hasFile('research_manuscript')) {
            $this->researchService->uploadFiles(
                $research,
                $request->file('research_approval_sheet'),
                $request->file('research_manuscript')
            );
        }

        if ($request->has('keywords')) {
            $keywordIds = collect($request->input('keywords', []))
                ->map(fn ($name) => trim((string) $name))
                ->filter()
                ->map(fn ($name) => Keyword::firstOrCreate(['keyword_name' => $name])->id)
                ->unique()
                ->values()
                ->all();
            $research->keywords()->sync($keywordIds);
        }

        if ($request->has('panelists')) {
            $research->panelists()->sync($request->input('panelists', []));
        }

        if ($request->has('researchers')) {
            $this->syncResearchers($research, $request->input('researchers', []));
        }

        if ($request->has('agendas')) {
            $research->agendas()->sync($request->input('agendas', []));
        }

        if ($request->has('sdgs')) {
            $research->sdgs()->sync($request->input('sdgs', []));
        }

        if ($request->has('srigs')) {
            $research->srigs()->sync($request->input('srigs', []));
        }

        return redirect()->back()
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
     * Display the Manage Research page for MCIIS Staff (and Admin).
     */
    public function manage(Request $request): Response
    {
        $this->authorize('manage', Research::class);

        $search = trim((string) $request->input('search', ''));

        $query = Research::query()
            ->select(['id', 'research_title', 'program_id', 'research_adviser'])
            ->with([
                'program:id,name,code',
                'adviser:id,first_name,middle_name,last_name',
            ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('research_title', 'like', "%{$search}%")
                    ->orWhere('id', $search)
                    ->orWhereHas('program', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 15;
        }

        $researches = $query->orderByDesc('id')->paginate($perPage)->withQueryString();

        return Inertia::render('staff/research/index', [
            'researches' => $researches,
            'filters' => ['search' => $search],
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            'faculties' => Faculty::select('id', 'first_name', 'middle_name', 'last_name', 'position')->orderBy('last_name')->get(),
            'keywordOptions' => Keyword::select('id', 'keyword_name')->orderBy('keyword_name')->get(),
            'agendas' => Agenda::select('id', 'name')->orderBy('name')->get(),
            'sdgs' => Sdg::select('id', 'name')->orderBy('name')->get(),
            'srigs' => Srig::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Lightweight JSON payload of a research's raw, editable attributes.
     */
    public function editData(Research $research): JsonResponse
    {
        $this->authorize('update', $research);

        $research->load([
            'researchers:id,research_id,first_name,middle_name,last_name,email',
            'keywords:id,keyword_name',
            'panelists:id',
            'agendas:id',
            'sdgs:id',
            'srigs:id',
        ]);

        return response()->json([
            'data' => [
                'id' => $research->id,
                'research_title' => $research->research_title,
                'program_id' => $research->program_id,
                'research_adviser' => $research->research_adviser,
                'published_month' => $research->published_month,
                'published_year' => $research->published_year,
                'research_abstract' => $research->research_abstract,
                'research_approval_sheet' => $research->research_approval_sheet,
                'research_manuscript' => $research->research_manuscript,
                'researchers' => $research->researchers->map(fn ($r) => [
                    'id' => $r->id,
                    'first_name' => $r->first_name,
                    'middle_name' => $r->middle_name,
                    'last_name' => $r->last_name,
                    'email' => $r->email,
                ])->values(),
                'keyword_names' => $research->keywords->pluck('keyword_name')->values(),
                'panelist_ids' => $research->panelists->pluck('id')->values(),
                'agenda_ids' => $research->agendas->pluck('id')->values(),
                'sdg_ids' => $research->sdgs->pluck('id')->values(),
                'srig_ids' => $research->srigs->pluck('id')->values(),
            ],
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
        $research->update($request->safe()->except([
            'research_approval_sheet', 'research_manuscript', 'keywords', 'researchers', 'panelists', 'agendas', 'sdgs', 'srigs',
        ]));

        if ($request->hasFile('research_approval_sheet') || $request->hasFile('research_manuscript')) {
            $this->researchService->uploadFiles(
                $research,
                $request->file('research_approval_sheet'),
                $request->file('research_manuscript')
            );
        }

        if ($request->has('keywords')) {
            $keywordIds = collect($request->input('keywords', []))
                ->map(fn ($name) => trim((string) $name))
                ->filter()
                ->map(fn ($name) => Keyword::firstOrCreate(['keyword_name' => $name])->id)
                ->unique()
                ->values()
                ->all();
            $research->keywords()->sync($keywordIds);
        }

        if ($request->has('panelists')) {
            $research->panelists()->sync($request->input('panelists', []));
        }

        if ($request->has('researchers')) {
            $this->syncResearchers($research, $request->input('researchers', []));
        }

        if ($request->has('agendas')) {
            $research->agendas()->sync($request->input('agendas', []));
        }

        if ($request->has('sdgs')) {
            $research->sdgs()->sync($request->input('sdgs', []));
        }

        if ($request->has('srigs')) {
            $research->srigs()->sync($request->input('srigs', []));
        }

        return redirect()->back()
            ->with('success', 'Research updated successfully.');
    }

    /**
     * Reconcile the research's researchers with the submitted list:
     * update matched-by-id rows, create new ones, delete removed ones.
     */
    protected function syncResearchers(Research $research, array $researchers): void
    {
        $keepIds = [];

        foreach ($researchers as $data) {
            $payload = [
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'],
                'email' => $data['email'] ?? null,
            ];

            $researcher = !empty($data['id']) ? $research->researchers()->find($data['id']) : null;

            if ($researcher) {
                $researcher->update($payload);
            } else {
                $researcher = $research->researchers()->create($payload);
            }

            $keepIds[] = $researcher->id;
        }

        $research->researchers()->whereNotIn('id', $keepIds)->delete();
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


