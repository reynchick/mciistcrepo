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
use App\Http\Actions\Research\ChangeResearchStatusAction;
use App\Http\Actions\Research\HardDeleteResearchAction;
use App\Http\Actions\Research\PublishResearchAction;
use App\Http\Actions\Research\RequestAdviserMetadataAction;
use App\Http\Actions\Research\RestoreResearchAction;
use App\Http\Actions\Research\ReturnForRevisionAction;
use App\Http\Actions\Research\SubmitForReviewAction;
use App\Repositories\ResearchRepository;
use App\Services\ResearchInvitationService;
use App\Services\ResearchMailService;
use App\Services\ResearchService;
use App\Http\Requests\HardDeleteResearchRequest;
use App\Http\Requests\StoreResearchRequest;
use App\Http\Requests\TransitionResearchStatusRequest;
use App\Http\Requests\UpdateResearchRequest;
use App\Services\ResearchSaveDecisionService;
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
        protected SubmitForReviewAction $submitAction,
        protected ReturnForRevisionAction $returnAction,
        protected RequestAdviserMetadataAction $requestAdviserMetadataAction,
        protected PublishResearchAction $publishAction,
        protected ChangeResearchStatusAction $changeStatusAction,
        protected HardDeleteResearchAction $hardDeleteAction,
        protected ResearchRepository $researchRepository,
        protected ResearchService $researchService,
        protected ResearchInvitationService $invitationService,
        protected ResearchMailService $mailService,
        protected ResearchSaveDecisionService $saveDecisionService,
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
    public function checkTitle(Request $request): JsonResponse
    {
        $title = trim((string) $request->query('title', ''));

        if ($title === '') {
            return response()->json(['unique' => true]);
        }

        $exists = Research::query()
            ->where('research_title', $title)
            ->where('status', '!=', 
                \App\Enums\ResearchStatus::ARCHIVED->value)
            ->exists();

        return response()->json(['unique' => ! $exists]);
    }

    public function store(StoreResearchRequest $request): RedirectResponse
    {
        $data = $request->safe()->except([
            'research_approval_sheet', 'research_manuscript', 'keywords', 'researchers', 'panelists', 'agendas', 'sdgs', 'srigs',
        ]);

        $user = Auth::user();

        // Ensure uploaded_by is set to the authenticated user
        $data['uploaded_by'] = $user->id;

        // Respect any explicit adviser supplied on the upload request.
        // Only fall back to the authenticated faculty profile when the user is acting
        // as a faculty adviser and no adviser was explicitly selected.
        $explicitAdviserId = $request->input('research_adviser');

        if (!empty($explicitAdviserId)) {
            $data['research_adviser'] = $explicitAdviserId;
        } elseif ($user->isFaculty() && $user->faculty) {
            $data['research_adviser'] = $user->faculty->id;
        } elseif ($user->isMCIISStaff()) {
            // Staff uploads without an explicit adviser remain valid and will have a null adviser.
            $data['research_adviser'] = null;
        } else {
            // Only staff and faculty can create research
            abort(403, 'Unauthorized');
        }

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
    public function invitation(string $token)
    {
        $invitation = $this->invitationService->findValidInvitation($token);

        if (! $invitation) {
            return Inertia::render('research/invitation-invalid');
        }

        $user = Auth::user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Ensure the signed-in user's email matches the invitation snapshot and research allows collaboration
        if (strtolower($user->email) !== strtolower($invitation->email_snapshot) || ! $invitation->researcher->research->canStudentsEdit()) {
            return Inertia::render('research/invitation-invalid');
        }

        $this->invitationService->accept($invitation, $user);

        return redirect()->route('home')->with('success', 'Invitation accepted.');
    }

    public function show(Research $research): Response
    {
        $research->load([
            'program:id,name',
            'adviser:id,first_name,middle_name,last_name',
            'researchers:id,research_id,first_name,middle_name,last_name',
            'keywords:id,keyword_name',
            'uploader:id,first_name,last_name,email',
            'researchEntryLogsTargeting.modifiedBy:id,first_name,last_name,email',
        ]);

        return Inertia::render('research/show', [
            'research' => $research,
            'displayStatusLabel' => $research->status?->label() ?? $research->status,
            'latestNotes' => $research->researchEntryLogsTargeting()
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn ($log) => $log->metadata['note'] ?? null)
                ->filter()
                ->values(),
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
     * Display the My Researches page for Faculty (researches they advise).
     */
    public function facultyMyResearches(Request $request): Response
    {
        $user = Auth::user();
        $this->authorize('viewOwn', Research::class);

        $facultyId = $user->faculty->id;
        $search = trim((string) $request->input('search', ''));

        $query = Research::query()
            ->where('research_adviser', $facultyId)
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

        return Inertia::render('faculty/research/index', [
            'researches' => $researches,
            'filters' => ['search' => $search],
            'currentFaculty' => [
                'id' => $user->faculty->id,
                'first_name' => $user->faculty->first_name,
                'middle_name' => $user->faculty->middle_name,
                'last_name' => $user->faculty->last_name,
            ],
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            'faculties' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->orderBy('last_name')->get(),
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
        ]);

        return response()->json([
            'data' => [
                'id' => $research->id,
                'research_title' => $research->research_title,
                'program_id' => $research->program_id,
                'research_adviser' => $research->research_adviser,
                'completed_month' => $research->completed_month,
                'completed_year' => $research->completed_year,
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
            'displayStatusLabel' => $research->status?->label() ?? $research->status,
            'latestNotes' => $research->researchEntryLogsTargeting()
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn ($log) => $log->metadata['note'] ?? null)
                ->filter()
                ->values(),
        ]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateResearchRequest $request, Research $research)
    {
        $user = Auth::user();
        $data = $request->safe()->except([
            'research_approval_sheet', 'research_manuscript',
        ]);

        if ($user->isFaculty() && !$user->isMCIISStaff() && $user->faculty) {
            $data['research_adviser'] = $research->research_adviser;
        }

        if ($request->filled('invitation_action')) {
            $this->authorize('sendInvitations', $research);
        }

        $summary = $this->saveDecisionService->summarize($research, $data);
        $decisionRequired = $this->saveDecisionService->requiresDecision($summary);

        if (! $request->filled('invitation_action') && $decisionRequired) {
            $payload = [
                'invitation_decision_required' => true,
                'summary' => $summary,
                'removal_only' => $this->saveDecisionService->isRemovalOnly($summary),
                'updated_at' => $research->updated_at?->toJSON(),
            ];

            if ($request->isJson()
                || $request->expectsJson()
                || $request->wantsJson()
                || str_contains((string) $request->header('accept'), 'application/json')) {
                return response()->json($payload);
            }

            return redirect()->back()->with($payload);
        }

        $result = $this->saveDecisionService->commit(
            $research,
            $data,
            $request->input('invitation_action', 'save_only'),
            $request->input('updated_at'),
            $user,
        );

        if ($request->hasFile('research_approval_sheet') || $request->hasFile('research_manuscript')) {
            $this->researchService->uploadFiles(
                $research,
                $request->file('research_approval_sheet'),
                $request->file('research_manuscript')
            );
            $result['research']->refresh();
        }

        if ($request->wantsJson()) {
            return response()->json([ 'success' => true, 'data' => $result ]);
        }

        return redirect()->back()->with('success', 'Research updated successfully.');
    }

    /**
     * Reconcile the research's researchers with the submitted list:
     * update matched-by-id rows, create new ones, delete removed ones.
     */
    protected function syncResearchers(Research $research, array $researchers): void
    {
        $keepIds = [];
        $summary = [
            'added' => [],
            'changed_emails' => [],
            'removed' => [],
            'expired_invitations' => [],
            'archive_revoked_access' => [],
        ];

        foreach ($researchers as $data) {
            $payload = [
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'],
                'email' => $data['email'] ?? null,
                'is_lead_author' => (bool) ($data['is_lead_author'] ?? false),
            ];

            $researcher = !empty($data['id']) ? $research->researchers()->find($data['id']) : null;

            if ($researcher) {
                $previousEmail = $researcher->email;
                $researcher->update($payload);

                if (!blank($payload['email']) && $payload['email'] !== $previousEmail) {
                    // Revoke any pending invitations for this researcher and create a fresh one.
                    $this->invitationService->revokeForResearcher($researcher);
                    $created = $this->invitationService->createForResearcher($researcher);

                    $summary['changed_emails'][] = [
                        'id' => $researcher->id,
                        'previous_email' => $previousEmail,
                        'new_email' => $payload['email'],
                        'invitation_id' => $created['invitation']->id,
                    ];
                }
            } else {
                $researcher = $research->researchers()->create($payload);

                if (!blank($payload['email'])) {
                    $created = $this->invitationService->createForResearcher($researcher);

                    $summary['added'][] = [
                        'id' => $researcher->id,
                        'email' => $payload['email'],
                        'invitation_id' => $created['invitation']->id,
                    ];
                } else {
                    $summary['added'][] = [
                        'id' => $researcher->id,
                        'email' => null,
                    ];
                }
            }

            $keepIds[] = $researcher->id;
        }

        $removed = $research->researchers()->whereNotIn('id', $keepIds)->get();

        foreach ($removed as $r) {
            $summary['removed'][] = [
                'id' => $r->id,
                'email' => $r->email,
            ];
            $r->delete();
        }

        // Detect expired unaccepted invitations for this research
        $expiredInvitations = $research->researchers()->with('invitations')->get()->flatMap(function ($r) {
            return $r->invitations->filter(fn($i) => $i->isExpired());
        });

        foreach ($expiredInvitations as $inv) {
            $summary['expired_invitations'][] = [
                'id' => $inv->id,
                'researcher_id' => $inv->researcher_id,
                'email_snapshot' => $inv->email_snapshot,
                'expires_at' => $inv->expires_at?->toDateTimeString(),
            ];
        }

        // If the research is archived, revoke accepted access for all researchers and record it.
        if ($research->isArchived()) {
            foreach ($research->researchers()->whereNotNull('user_id')->get() as $r) {
                $this->invitationService->revokeAcceptedAccess($r);
                $summary['archive_revoked_access'][] = [
                    'id' => $r->id,
                    'previous_user_id' => $r->user_id,
                ];
            }
        }

        // Attach the summary to the session so callers can display it.
        session()->flash('research_change_summary', $summary);
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

    public function submit(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('submit', $research);

        $this->submitAction->execute($research, $request->user(), $request->input('note'));

        return back()->with('success', 'Research submitted for review.');
    }

    public function returnForRevision(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('returnForRevision', $research);

        $this->returnAction->execute($research, $request->user(), $request->input('note', ''), $request->input('context', 'faculty_to_student'));

        return back()->with('success', 'Research returned for revision.');
    }

    public function requestAdviserMetadata(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('requestAdviserMetadata', $research);

        $this->requestAdviserMetadataAction->execute($research, $request->user(), $request->input('note', ''), $request->input('context', 'staff_to_adviser'));

        return back()->with('success', 'Adviser metadata request sent.');
    }

    public function publish(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('publish', $research);

        $this->publishAction->execute($research, $request->user(), $request->input('note'));

        return back()->with('success', 'Research published.');
    }

    public function archive(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('archive', $research);

        $this->archiveAction->execute($research, $request->input('reason', ''), $request->user());

        return back()->with('success', 'Research archived.');
    }

    public function restore(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('restore', $research);

        $this->restoreAction->execute($research, $request->user());

        return back()->with('success', 'Research restored.');
    }

    public function updateStatus(TransitionResearchStatusRequest $request, Research $research): RedirectResponse
    {
        $this->authorize('changeStatus', $research);

        $this->changeStatusAction->execute($research, $request->user(), $request->input('status'), $request->input('note'));

        return back()->with('success', 'Research status updated.');
    }

    public function forceDelete(HardDeleteResearchRequest $request, Research $research): RedirectResponse
    {
        $this->authorize('hardDelete', $research);

        $this->hardDeleteAction->execute($research, $request->user(), $request->input('reason'));

        return redirect()->route('research.index')->with('success', 'Research permanently deleted.');
    }

    public function statusHistory(Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        $logs = $research->researchEntryLogsTargeting()
            ->with('modifiedBy:id,first_name,last_name,email')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action_type' => $log->action_type,
                'created_at' => $log->created_at?->toIso8601String(),
                'modified_by' => $log->modifiedBy ? $log->modifiedBy->name : null,
                'metadata' => $log->metadata,
            ]);

        return response()->json(['data' => $logs]);
    }

}


