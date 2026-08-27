<?php
namespace App\Http\Controllers;


use App\Models\Research;
use App\Models\Researcher;
use App\Models\ResearchEntryLog;
use App\Models\Program;
use App\Models\Faculty;
use App\Models\Keyword;
use App\Models\Agenda;
use App\Models\Sdg;
use App\Models\Srig;
use App\Models\User;
use App\Http\Actions\Research\ArchiveResearchAction;
use App\Http\Actions\Research\ChangeResearchStatusAction;
use App\Http\Actions\Research\HardDeleteResearchAction;
use App\Http\Actions\Research\InviteResearchersAction;
use App\Http\Actions\Research\PostResearchAction;
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
use App\Services\ResearchDraftService;
use App\Services\PostingReadinessService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Throwable;
use App\Support\BrowserData;


class ResearchController extends Controller
{
    public function __construct(
        protected ArchiveResearchAction $archiveAction,
        protected RestoreResearchAction $restoreAction,
        protected SubmitForReviewAction $submitAction,
        protected ReturnForRevisionAction $returnAction,
        protected RequestAdviserMetadataAction $requestAdviserMetadataAction,
        protected PostResearchAction $postAction,
        protected ChangeResearchStatusAction $changeStatusAction,
        protected HardDeleteResearchAction $hardDeleteAction,
        protected InviteResearchersAction $inviteAction,
        protected ResearchRepository $researchRepository,
        protected ResearchService $researchService,
        protected ResearchInvitationService $invitationService,
        protected ResearchMailService $mailService,
        protected ResearchSaveDecisionService $saveDecisionService,
        protected ResearchDraftService $draftService,
        protected PostingReadinessService $postingReadinessService,
    ) {
        // `edit` needs a status-aware redirect for posted entries.  Keep the
        // normal resource authorization for every mutating action, but handle
        // edit explicitly in edit() so a linked viewer is sent to the detail
        // page rather than rejected before the controller runs.
        $this->authorizeResource(Research::class, 'research', ['except' => ['edit']]);
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
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            'advisers' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->get(),
            'workflow' => [
                'status' => 'draft',
                'isRestoredDraft' => false,
                'studentCollaborationEnabled' => true,
                'postingReadiness' => [
                    'ready' => false,
                    'missing' => ['research_title', 'program_id'],
                ],
            ],
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function checkTitle(Request $request): JsonResponse
    {
        $title = trim((string) $request->query('title', ''));
        $exceptResearchId = $request->integer('except');

        if ($title === '') {
            return response()->json(['unique' => true]);
        }

        $query = Research::query()
            ->where('research_title', $title)
            ->where('status', '!=', \App\Enums\ResearchStatus::ARCHIVED->value);

        if ($exceptResearchId > 0) {
            $query->whereKeyNot($exceptResearchId);
        }

        $exists = $query->exists();

        return response()->json(['unique' => ! $exists]);
    }

    public function store(StoreResearchRequest $request): RedirectResponse
    {
        $data = $request->safe()->except([
            'research_approval_sheet', 'research_manuscript', 'keywords', 'researchers', 'panelists', 'agendas', 'sdgs', 'srigs',
        ]);

        $user = Auth::user();
        $workflowAction = (string) $request->input('workflow_action', 'draft');

        // Ensure uploaded_by is set to the authenticated user
        $data['uploaded_by'] = $user->id;

        foreach ([
            'research_adviser',
            'completed_month',
            'completed_year',
            'research_abstract',
        ] as $field) {
            $data[$field] = $data[$field] ?? null;
        }

        // Staff and Faculty share this endpoint, but their adviser rules are
        // deliberately different.  Use the active role, not merely a role
        // assigned to the account: a multi-role user acting as Staff must be
        // able to upload on behalf of the faculty selected in the form.
        $explicitAdviserId = $request->input('research_adviser');

        if ($user->isActingAs('Faculty') && $user->faculty) {
            // Faculty uploader is always the adviser for this workflow.
            $data['research_adviser'] = $user->faculty->id;
            $data['student_collaboration_enabled'] = true;
        } elseif ($user->isActingAs('MCIIS Staff') || $user->isMCIISStaff()) {
            // Staff upload records on behalf of any faculty, so preserve the
            // Adviser selected and submitted from the Staff upload form.
            $data['research_adviser'] = $explicitAdviserId ?: null;
            $data['student_collaboration_enabled'] = false;
        } elseif (!empty($explicitAdviserId)) {
            $data['research_adviser'] = $explicitAdviserId;
        } else {
            // Only staff and faculty can create research
            abort(403, 'Unauthorized');
        }

        DB::beginTransaction();

        try {
            $research = Research::create($data);

            // These existing timestamp/user pairs explicitly distinguish a
            // Staff-confirmed unavailable value from an unfilled value.
            $unavailableFields = [
                'panelists_unavailable' => 'panelists_unavailable_legacy',
                'approval_sheet_unavailable' => 'approval_sheet_unavailable_legacy',
                'manuscript_unavailable' => 'manuscript_unavailable_legacy',
            ];
            $unavailableAttributes = [];
            foreach ($unavailableFields as $input => $attributePrefix) {
                if ($request->boolean($input)) {
                    $unavailableAttributes["{$attributePrefix}_at"] = now();
                    $unavailableAttributes["{$attributePrefix}_by"] = $user->id;
                }
            }
            if ($unavailableAttributes !== []) {
                $research->forceFill($unavailableAttributes)->save();
            }

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
                $researchers = $request->input('researchers', []);
                if ($workflowAction === 'invite') {
                    $researchers = array_values(array_filter(
                        $researchers,
                        fn (array $researcher) => filled($researcher['first_name'] ?? null)
                            && filled($researcher['last_name'] ?? null)
                            && filled($researcher['email'] ?? null)
                    ));
                }
                $this->syncResearchers($research, $researchers);
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

            if ($workflowAction === 'invite') {
                $this->authorize('sendInvitations', $research);
                $this->inviteAction->execute($research, $user);
                DB::commit();

                return redirect()->back()
                    ->with('success', 'Research saved and invitations sent.')
                    ->with('new_research_id', $research->id)
                    ->with('new_research_title', $research->research_title);
            }

            if ($workflowAction === 'post') {
                $this->authorize('post', $research);
                $this->postAction->execute($research, $user);
                DB::commit();

                return redirect()->back()
                    ->with('success', 'Research posted successfully.')
                    ->with('new_research_id', $research->id)
                    ->with('new_research_title', $research->research_title);
            }

            DB::commit();

            return redirect()->back()
                ->with('success', 'Research created successfully.')
                ->with('new_research_id', $research->id)
                ->with('new_research_title', $research->research_title);
        } catch (InvalidArgumentException $exception) {
            DB::rollBack();

            if ($workflowAction === 'post') {
                return redirect()->back()->withErrors([
                    'post' => $exception->getMessage(),
                ])->withInput();
            }

            throw $exception;
        } catch (Throwable $exception) {
            DB::rollBack();
            throw $exception;
        }
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
            return redirect()->guest(route('login'));
        }

        // Ensure the signed-in user's email matches the invitation snapshot and research allows collaboration
        if (strtolower($user->email) !== strtolower($invitation->email_snapshot) || ! $invitation->researcher->research->canStudentsEdit()) {
            return Inertia::render('research/invitation-invalid');
        }

        $this->invitationService->accept($invitation, $user);

        return redirect()->route('student.my-researches')->with('success', 'Invitation accepted.');
    }

    public function show(Research $research): Response
    {
        $research->load([
            'program:id,name',
            'adviser:id,first_name,middle_name,last_name',
            'researchers:id,research_id,first_name,middle_name,last_name',
            'keywords:id,keyword_name',
            'panelists:id,first_name,middle_name,last_name',
            'agendas:id,name',
            'sdgs:id,name',
            'srigs:id,name',
            'uploadedBy:id,first_name,last_name,email',
            'researchEntryLogsTargeting.modifiedBy:id,first_name,last_name,email',
        ]);

        $user = Auth::user();
        $this->draftService->applyToView($research, $user);
        $missing = $this->postingReadinessService->missingRequirements($research);

        return Inertia::render('research/show', [
            'research' => $research,
            'displayStatusLabel' => $research->status?->label() ?? $research->status,
            'capabilities' => $this->researchCapabilities($research, $user),
            'workflow' => $this->researchWorkflow($research),
            'postingReadiness' => [
                'ready' => empty($missing),
                'missing' => array_values($missing),
            ],
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
        $status = trim((string) $request->input('status', ''));
        $validStatuses = array_keys(config('research.statuses', []));

        if ($status === 'all' || ! in_array($status, $validStatuses, true)) {
            $status = '';
        }

        $query = Research::query()
            ->select(['id', 'research_title', 'program_id', 'research_adviser', 'completed_year', 'status'])
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

        if ($status !== '') {
            $query->where('status', $status);
        } else {
            // Archived records remain available to staff through the explicit
            // status filter, but never appear in the default management list.
            $query->active();
        }

        $perPage = (int) $request->input('per_page', 15);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 15;
        }

        $researches = $query->orderByDesc('id')->paginate($perPage)->withQueryString();

        return Inertia::render('staff/research/index', [
            'researches' => $researches,
            'filters' => ['search' => $search, 'status' => $status !== '' ? $status : 'all'],
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

        if (! $user->isFaculty() || ! $user->faculty) {
            abort(403);
        }

        $facultyId = $user->faculty->id;
        $search = trim((string) $request->input('search', ''));

        $query = Research::query()
            ->where('research_adviser', $facultyId)
            ->select(['id', 'research_title', 'program_id', 'research_adviser', 'uploaded_by', 'status'])
            ->with([
                'program:id,name,code',
                'adviser:id,first_name,middle_name,last_name',
                'uploadedBy.roles:id,name',
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
        $researches->getCollection()->each(function (Research $research): void {
            $research->setAttribute('staff_originated', $research->uploadedBy?->isMCIISStaff() ?? false);
        });

        return Inertia::render('faculty/research/index', [
            'researches' => $researches,
            'filters' => ['search' => $search],
            'capabilities' => $this->researchCapabilitiesForList($user),
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
        if (! Auth::user()->can('update', $research)) {
            $this->authorize('updateInvitedResearchers', $research);
        }

        $research->load([
            'researchers:id,research_id,first_name,middle_name,last_name,email',
            'keywords:id,keyword_name',
            'panelists:id',
            'agendas:id',
            'sdgs:id',
            'srigs:id',
        ]);

        $this->draftService->applyToView($research, Auth::user());
        $missingPostingRequirements = $this->postingReadinessService->missingRequirements($research);

        return response()->json([
            'data' => [
                'id' => $research->id,
                'status' => $research->status?->value ?? $research->status,
                'updated_at' => $research->updated_at?->toJSON(),
                'research_title' => $research->research_title,
                'program_id' => $research->program_id,
                'research_adviser' => $research->research_adviser,
                'completed_month' => $research->completed_month,
                'completed_year' => $research->completed_year,
                'research_abstract' => $research->research_abstract,
                'research_approval_sheet' => $research->research_approval_sheet,
                'research_manuscript' => $research->research_manuscript,
                'approval_sheet_unavailable' => $research->approval_sheet_unavailable,
                'manuscript_unavailable' => $research->manuscript_unavailable,
                'panelists_unavailable' => $research->panelists_unavailable,
                'posting_readiness' => [
                    'ready' => empty($missingPostingRequirements),
                    'missing' => array_values($missingPostingRequirements),
                ],
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
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    /**
     * Researcher-only editor for a Faculty adviser's Draft (Invited) entry.
     * This deliberately accepts no research metadata, files, or tags.
     */
    public function updateInvitedResearchers(Request $request, Research $research): JsonResponse|RedirectResponse
    {
        $this->authorize('updateInvitedResearchers', $research);

        $data = $request->validate([
            'updated_at' => ['nullable', 'string'],
            'invitation_action' => ['required', 'in:save_only,send_invitations'],
            'researchers' => ['required', 'array', 'min:1'],
            'researchers.*.id' => ['nullable', 'integer', 'exists:researchers,id'],
            'researchers.*.first_name' => ['required', 'string', 'max:255'],
            'researchers.*.middle_name' => ['nullable', 'string', 'max:255'],
            'researchers.*.last_name' => ['required', 'string', 'max:255'],
            'researchers.*.email' => ['required', 'email'],
        ]);

        $existingResearchers = $research->researchers()->get()->keyBy('id');
        $submittedIds = collect($data['researchers'])
            ->pluck('id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->all();

        if (count($submittedIds) !== count(array_unique($submittedIds)) || count($submittedIds) !== $existingResearchers->count()) {
            throw ValidationException::withMessages([
                'researchers' => 'Existing researchers cannot be removed from this screen.',
            ]);
        }

        $emails = [];
        foreach ($data['researchers'] as $index => $researcher) {
            $existing = ! empty($researcher['id']) ? $existingResearchers->get((int) $researcher['id']) : null;
            if (! empty($researcher['id']) && ! $existing) {
                throw ValidationException::withMessages([
                    "researchers.{$index}.id" => 'This researcher does not belong to this research.',
                ]);
            }

            $email = strtolower(trim($researcher['email']));
            if (isset($emails[$email])) {
                throw ValidationException::withMessages([
                    "researchers.{$index}.email" => 'Each researcher must have a unique email address.',
                ]);
            }
            $emails[$email] = true;

            $emailChanged = ! $existing || strtolower((string) $existing->email) !== $email;
            if ($emailChanged && ! preg_match('/^[a-zA-Z0-9._%+-]+@usep\.edu\.ph$/', $email)) {
                throw ValidationException::withMessages([
                    "researchers.{$index}.email" => 'The researcher email must be a valid USeP email (name@usep.edu.ph).',
                ]);
            }

            if (Researcher::query()->where('email', $email)->when($existing, fn ($query) => $query->whereKeyNot($existing->id))->exists()) {
                throw ValidationException::withMessages([
                    "researchers.{$index}.email" => 'This email is already used by another researcher.',
                ]);
            }
        }

        $result = $this->saveDecisionService->commit(
            $research,
            ['researchers' => $data['researchers']],
            $data['invitation_action'],
            $data['updated_at'] ?? null,
            Auth::user(),
        );

        if ($request->wantsJson() || $request->expectsJson() || $request->isJson()) {
            return response()->json(['success' => true, 'data' => $result]);
        }

        return redirect()->back()->with('success', $data['invitation_action'] === 'send_invitations'
            ? 'Researcher changes saved and invitations sent.'
            : 'Researcher changes saved.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Research $research): Response|RedirectResponse
    {
        // A posted entry is intentionally read-only.  It remains viewable to
        // linked students and its adviser, so send those users to the detail
        // page instead of letting the resource authorization turn this into a
        // dead edit page.
        if (in_array(($research->status?->value ?? $research->status), ['posted', 'draft_invited', 'submitted'], true)) {
            $this->authorize('view', $research);

            return redirect()->route('research.show', $research);
        }

        // Do this explicitly as well as through authorizeResource().  This
        // protects direct requests to the edit endpoint and keeps its access
        // contract obvious when the route is changed in the future.
        $this->authorize('update', $research);

        $research->load(['researchers', 'keywords', 'agendas', 'sdgs', 'srigs', 'panelists']);

        $user = Auth::user();
        $this->draftService->applyToView($research, $user);
        $missing = $this->postingReadinessService->missingRequirements($research);

        return Inertia::render('research/edit', [
            'research' => $research,
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            // ResearchEditPage/BasicInfo consume this prop as `faculties`.
            // Previously this was named `advisers`, leaving `faculties`
            // undefined and throwing on faculties.map() before React could
            // mount the application shell.
            'faculties' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->orderBy('last_name')->get(),
            'keywords' => Keyword::select('id', 'keyword_name')->orderBy('keyword_name')->get(),
            'agendas' => Agenda::select('id', 'name')->orderBy('name')->get(),
            'sdgs' => Sdg::select('id', 'name')->orderBy('name')->get(),
            'srigs' => Srig::select('id', 'name')->orderBy('name')->get(),
            'capabilities' => $this->researchCapabilities($research, $user),
            'workflow' => $this->researchWorkflow($research),
            'postingReadiness' => [
                'ready' => empty($missing),
                'missing' => array_values($missing),
            ],
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

    public function studentMyResearches(Request $request): Response
    {
        $user = Auth::user();
        $this->authorize('viewOwn', Research::class);

        if (! $user->isStudent()) {
            abort(403);
        }

        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));

        $query = Research::query()
            ->where('status', '!=', 'archived')
            ->whereHas('researchers', function ($researchers) use ($user): void {
                $researchers->where('user_id', $user->id);
            })
            ->select(['id', 'research_title', 'program_id', 'status'])
            ->with(['program:id,name']);

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('research_title', 'like', "%{$search}%")
                    ->orWhere('id', $search)
                    ->orWhereHas('program', function ($pq) use ($search): void {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $researches = $query->orderByDesc('id')->get()
            ->map(function (Research $research) use ($user) {
                $this->draftService->applyToView($research, $user);
                return [
                    'id' => $research->id,
                    'research_title' => $research->research_title,
                    'program' => $research->program ? [
                        'id' => $research->program->id,
                        'name' => $research->program->name,
                    ] : null,
                    'status' => $research->status?->value ?? $research->status,
                    'revision_note' => $research->latestRevisionNote(),
                    'capabilities' => [
                        'can_view' => (bool) $user->can('view', $research),
                        'can_edit' => (bool) $user->can('update', $research),
                        'can_submit' => (bool) $user->can('submit', $research),
                        'read_only_reason' => $this->readOnlyReasonFor($research, $user),
                    ],
                ];
            })
            ->values();

        return Inertia::render('research/my-researches', [
            'researches' => $researches,
            'filters' => [
                'search' => $search,
                'status' => $status !== '' ? $status : 'all',
            ],
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            'faculties' => Faculty::select('id', 'first_name', 'middle_name', 'last_name')->orderBy('last_name')->get(),
            'keywordOptions' => Keyword::select('id', 'keyword_name')->orderBy('keyword_name')->get(),
            'agendas' => Agenda::select('id', 'name')->orderBy('name')->get(),
            'sdgs' => Sdg::select('id', 'name')->orderBy('name')->get(),
            'srigs' => Srig::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    protected function researchActivityForFaculty(User $user): array
    {
        $facultyId = $user->faculty?->id;

        return $this->researchActivityQuery()
            ->whereHas('targetResearch', function ($query) use ($user, $facultyId): void {
                $query->where('uploaded_by', $user->id)
                    ->orWhere('research_adviser', $facultyId);
            })
            ->get()
            ->map(fn (ResearchEntryLog $log) => $this->researchActivityPayload($log))
            ->all();
    }

    protected function researchActivityForStudent(User $user): array
    {
        return $this->researchActivityQuery()
            ->whereHas('targetResearch.researchers', function ($query) use ($user): void {
                $query->where('user_id', $user->id);
            })
            ->get()
            ->map(fn (ResearchEntryLog $log) => $this->researchActivityPayload($log))
            ->all();
    }

    protected function researchActivityQuery()
    {
        return ResearchEntryLog::query()
            ->with([
                'targetResearch:id,research_title',
                'modifiedBy:id,first_name,last_name',
            ])
            ->latest('created_at')
            ->limit(15);
    }

    protected function researchActivityPayload(ResearchEntryLog $log): array
    {
        $safeLog = BrowserData::log($log, true);

        return [
            'id' => $safeLog['id'],
            'action_type' => $safeLog['action_type'],
            'created_at' => $safeLog['created_at']?->toIso8601String(),
            'modified_by' => $safeLog['modifiedByUser'] ?? null,
            'old_values' => $safeLog['old_values'] ?? [],
            'new_values' => $safeLog['new_values'] ?? [],
            'metadata' => $safeLog['metadata'] ?? [],
            'research_title' => $safeLog['targetResearch']['title'] ?? null,
        ];
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateResearchRequest $request, Research $research)
    {
        $user = Auth::user();
        $workflowAction = (string) $request->input('workflow_action', '');
        $data = $request->safe()->except([
            'research_approval_sheet', 'research_manuscript',
        ]);

        if ($user->isStudent()) {
            $this->draftService->save(
                $research,
                $user,
                $data,
                $request->file('research_approval_sheet'),
                $request->file('research_manuscript'),
            );

            if ($request->wantsJson() || $request->expectsJson() || $request->isJson()) {
                return response()->json(['success' => true, 'data' => ['research' => BrowserData::draftResearch($research->refresh())]]);
            }

            return redirect()->back()->with('success', 'Research draft saved privately.');
        }

        if ($user->isActingAs('Faculty') && $user->faculty) {
            $data['research_adviser'] = $research->research_adviser;
        }

        $invitationAction = $workflowAction === 'invite'
            ? 'send_invitations'
            : $request->input('invitation_action', 'save_only');

        if ($request->filled('invitation_action') || $workflowAction === 'invite') {
            $this->authorize('sendInvitations', $research);
        }

        $summary = $this->saveDecisionService->summarize($research, $data);
        $decisionRequired = $this->saveDecisionService->requiresDecision($summary);

        // The upload-draft workflow owns its three explicit actions.  Do not
        // divert it into the generic invitation-decision modal.
        if (! $request->filled('invitation_action') && ! in_array($workflowAction, ['draft', 'invite', 'post', 'staff_save'], true) && $decisionRequired) {
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
            $invitationAction,
            $request->input('updated_at'),
            $user,
        );

        if ($user->isMCIISStaff() || $user->isAdministrator()) {
            $unavailableFields = [
                'panelists_unavailable' => 'panelists_unavailable_legacy',
                'approval_sheet_unavailable' => 'approval_sheet_unavailable_legacy',
                'manuscript_unavailable' => 'manuscript_unavailable_legacy',
            ];
            $unavailableAttributes = [];

            foreach ($unavailableFields as $input => $attributePrefix) {
                if (! $request->has($input)) {
                    continue;
                }

                if ($request->boolean($input)) {
                    $unavailableAttributes["{$attributePrefix}_at"] = now();
                    $unavailableAttributes["{$attributePrefix}_by"] = $user->id;
                } else {
                    $unavailableAttributes["{$attributePrefix}_at"] = null;
                    $unavailableAttributes["{$attributePrefix}_by"] = null;
                }
            }

            if ($unavailableAttributes !== []) {
                $research->forceFill($unavailableAttributes)->save();
                $result['research']->refresh();
            }
        }

        if (
            $request->hasFile('research_approval_sheet')
            || $request->hasFile('research_manuscript')
            || $request->boolean('clear_research_approval_sheet')
            || $request->boolean('clear_research_manuscript')
        ) {
            $this->researchService->syncFiles(
                $research,
                $request->file('research_approval_sheet'),
                $request->file('research_manuscript'),
                $request->boolean('clear_research_approval_sheet'),
                $request->boolean('clear_research_manuscript')
            );
            $result['research']->refresh();
        }

        if ($workflowAction === 'post') {
            $this->authorize('post', $research);
            $this->postAction->execute($research->refresh(), $user);
        }

        if ($workflowAction === 'staff_save' && ($research->refresh()->status?->value ?? $research->status) === 'posted') {
            $this->authorize('changeStatus', $research);

            $oldValues = $research->getAttributes();
            $research->forceFill([
                'status' => 'draft',
                'posted_at' => null,
            ])->save();

            ResearchEntryLog::create([
                'modified_by' => $user->id,
                'target_research_id' => $research->id,
                'action_type' => ResearchEntryLog::ACTION_CHANGE_STATUS,
                'old_values' => array_intersect_key($oldValues, array_flip(['status', 'posted_at', 'submitted_at'])),
                'new_values' => array_intersect_key($research->getAttributes(), array_flip(['status', 'posted_at', 'submitted_at'])),
                'metadata' => ['context' => 'staff_save_unpost'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
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

        foreach ($researchers as $data) {
            if (blank($data['first_name'] ?? null) || blank($data['last_name'] ?? null)) {
                continue;
            }

            $payload = [
                'first_name' => $data['first_name'] ?? null,
                'middle_name' => $data['middle_name'] ?? null,
                'last_name' => $data['last_name'] ?? null,
                'email' => $data['email'] ?? null,
                'is_lead_author' => (bool) ($data['is_lead_author'] ?? false),
            ];

            $normalizedEmail = strtolower(trim((string) ($payload['email'] ?? '')));
            $matchedStudentId = $normalizedEmail === ''
                ? null
                : User::query()
                    ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
                    ->whereHas('roles', fn ($query) => $query->where('name', 'Student'))
                    ->value('id');

            $researcher = !empty($data['id']) ? $research->researchers()->find($data['id']) : null;

            if ($researcher) {
                $researcher->update(array_merge($payload, ['user_id' => $matchedStudentId]));
            } else {
                $researcher = $research->researchers()->create(array_merge($payload, ['user_id' => $matchedStudentId]));
            }

            $keepIds[] = $researcher->id;
        }

        $removed = $research->researchers()->whereNotIn('id', $keepIds)->get();

        foreach ($removed as $r) {
            $r->revokePendingInvitations();
            $r->revokeAccess();
            $r->delete();
        }
    }


    public function invite(Request $request, Research $research)
    {
        $this->authorize('sendInvitations', $research);

        $this->inviteAction->execute($research, $request->user());

        if ($request->wantsJson() || $request->expectsJson() || $request->isJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Research invitations sent.');
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

    public function submit(Request $request, Research $research): RedirectResponse|JsonResponse
    {
        $this->authorize('submit', $research);

        try {
            $this->submitAction->execute($research, $request->user(), $request->input('note'));
        } catch (InvalidArgumentException $exception) {
            if ($request->wantsJson() || $request->expectsJson() || $request->isJson()) {
                return response()->json(['message' => $exception->getMessage()], 422);
            }

            return back()->withErrors(['review' => $exception->getMessage()]);
        }

        if ($request->wantsJson() || $request->expectsJson() || $request->isJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Research submitted for review.');
    }

    public function returnForRevision(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('returnForRevision', $research);

        try {
            $this->returnAction->execute($research, $request->user(), (string) ($request->input('note') ?? ''), $request->input('context', 'faculty_to_student'));
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['note' => $exception->getMessage()]);
        }

        return back()->with('success', 'Research returned for revision.');
    }

    public function requestAdviserMetadata(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('requestAdviserMetadata', $research);

        $this->requestAdviserMetadataAction->execute($research, $request->user(), $request->input('note', ''), $request->input('context', 'staff_to_adviser'));

        return back()->with('success', 'Adviser metadata request sent.');
    }

    public function post(Request $request, Research $research): RedirectResponse
    {
        $this->authorize('post', $research);

        $this->postAction->execute($research, $request->user(), $request->input('note'));

        return back()->with('success', 'Research posted.');
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

    protected function researchCapabilities(Research $research, $user): array
    {
        $canEdit = (bool) ($user?->can('update', $research) ?? false);

        return [
            'can_view' => (bool) ($user?->can('view', $research) ?? false),
            'can_edit' => (bool) ($user?->can('update', $research) ?? false),
            'can_manage_researchers' => (bool) ($user?->can('manageResearchers', $research) ?? false),
            'can_send_invitations' => (bool) ($user?->can('sendInvitations', $research) ?? false),
            'can_use_invitation_save_decision' => (bool) ($user?->can('sendInvitations', $research) ?? false),
            'can_submit' => (bool) ($user?->can('submit', $research) ?? false),
            'can_post' => (bool) ($user?->can('post', $research) ?? false),
            'can_archive' => (bool) ($user?->can('archive', $research) ?? false),
            'can_restore' => (bool) ($user?->can('restore', $research) ?? false),
            'can_hard_delete' => (bool) ($user?->can('hardDelete', $research) ?? false),
            'can_return' => (bool) ($user?->can('returnForRevision', $research) ?? false),
            'can_request_metadata' => (bool) ($user?->can('requestAdviserMetadata', $research) ?? false),
            'is_linked_student' => (bool) ($user ? $research->researchers()->where('user_id', $user->id)->exists() : false),
            'is_staff' => (bool) ($user?->isAdministrator() || $user?->isMCIISStaff()),
            'read_only_reason' => $canEdit ? null : $this->readOnlyReasonFor($research, $user),
        ];
    }

    protected function researchCapabilitiesForList($user): array
    {
        return [
            'can_view' => false,
            'can_edit' => false,
            'can_manage_researchers' => false,
            'can_send_invitations' => false,
            'can_use_invitation_save_decision' => false,
            'can_submit' => false,
            'can_post' => false,
            'can_archive' => false,
            'can_restore' => false,
            'can_hard_delete' => (bool) ($user?->isAdministrator() || $user?->isMCIISStaff()),
            'can_return' => false,
            'can_request_metadata' => false,
            'is_linked_student' => false,
            'is_staff' => (bool) ($user?->isAdministrator() || $user?->isMCIISStaff()),
            'read_only_reason' => null,
        ];
    }

    protected function researchWorkflow(Research $research): array
    {
        $missing = $this->postingReadinessService->missingRequirements($research);

        return [
            'status' => $research->status?->value ?? $research->status,
            'isRestoredDraft' => $research->isRestoredWithoutStudentAccess(),
            'studentCollaborationEnabled' => $research->isStudentCollaborationEnabled(),
            'postingReadiness' => [
                'ready' => empty($missing),
                'missing' => array_values($missing),
            ],
        ];
    }

    protected function readOnlyReasonFor(Research $research, $user): ?string
    {
        $status = $research->status?->value ?? $research->status;

        if ($status === 'submitted' && $user?->isStudent()) {
            return 'This research is currently under faculty review and is read-only until returned for revision.';
        }

        if ($status === 'draft_invited' && $user?->isFaculty()) {
            return 'This research is awaiting student submission and is read-only.';
        }

        if ($status === 'posted') {
            return 'Posted research entries are read-only.';
        }

        if ($status === 'archived') {
            return 'Archived research entries are read-only.';
        }

        return null;
    }

    public function statusHistory(Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        $logs = $research->researchEntryLogsTargeting()
            ->with('modifiedBy:id,first_name,last_name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ResearchEntryLog $log) => BrowserData::log($log, true));

        return response()->json(['data' => $logs]);
    }

}
