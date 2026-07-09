<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserAuditLog;
use App\Models\Role;
use App\Mail\AccountCreatedMail;
use App\Observers\UserObserver;
use App\Services\FacultyService;
use App\Services\AuditLogService;
use App\Services\UserStatisticsService;
use App\Repositories\UserRepository;
use App\Http\Actions\User\CheckEmailUniquenessAction;
use App\Http\Actions\User\CheckStudentIdUniquenessAction;
use App\Http\Actions\User\GetUserSuggestionsAction;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Inertia\Response;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct(
        protected FacultyService $facultyService,
        protected UserStatisticsService $statisticsService,
        protected UserRepository $userRepository,
        protected CheckEmailUniquenessAction $checkEmailAction,
        protected CheckStudentIdUniquenessAction $checkStudentIdAction,
        protected GetUserSuggestionsAction $getUserSuggestionsAction
    ) {
        $this->authorizeResource(User::class, 'user');
    }

    /**
     * Check if an email is unique for user creation/edit.
     * Accepts ?email= and optional ?ignore=ID for edit mode.
     */
    public function checkEmail(): JsonResponse
    {
        $email = request('email', '');
        $ignoreId = request('ignore') ? (int) request('ignore') : null;
        
        return $this->checkEmailAction->execute($email, $ignoreId);
    }

    /**
     * Check if a student ID is unique for user creation/edit.
     * Accepts ?student_id= and optional ?ignore=ID for edit mode.
     */
    public function checkStudentId(): JsonResponse
    {
        $studentId = request('student_id', '');
        $ignoreId = request('ignore') ? (int) request('ignore') : null;
        
        return $this->checkStudentIdAction->execute($studentId, $ignoreId);
    }

    /**
     * Get user suggestions for autocomplete.
     */
    public function suggestions(): JsonResponse
    {
        $query = request('q', '');
        
        $suggestions = $this->getUserSuggestionsAction->execute($query);
        
        return response()->json(['suggestions' => $suggestions->toArray()]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        // Get users from repository with all filters applied
        $users = $this->userRepository->findWithFilters(request()->all());

        // Get all statistics from the service
        $statistics = $this->statisticsService->getAllStatistics();

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => [
                'search' => request('search'),
                'search_label' => request('search_label'),
                'role' => request('role'),
                'sort_by' => request('sort_by'),
                'sort_order' => request('sort_order'),
                'status' => request('status'),
            ],
            'roleDistribution' => $statistics['roleDistribution'],
            'deletedRoleDistribution' => $statistics['deletedRoleDistribution'],
            'recentRegistrations' => $statistics['recentRegistrations'],
            'totalUsersCount' => $statistics['totalUsersCount'],
            'deletedUsersCount' => $statistics['deletedUsersCount'],
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('users/create', [
            'roles' => $this->userRepository->getAllRoles(),
            'adminCount' => $this->userRepository->getAdministratorCount(),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     *
     * Create a user account for admin-created accounts (Faculty, Student, Admin, or Staff).
     * Sends account creation email with login instructions.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        $userData = $request->validated();
        $roleIds = $userData['role_ids'];
        unset($userData['role_ids']);
        $mailSent = false;

        // Determine role requirements
        $isFaculty = false;
        $isStudent = false;
        $needsProfileCompletion = false;
        
        foreach ($roleIds as $roleId) {
            $role = Role::find($roleId);
            if (!$role) continue;
            
            if ($role->name === 'Faculty') {
                $isFaculty = true;
            } elseif ($role->name === 'Student') {
                $isStudent = true;
            }
        }

        // Profile completion needed only for Faculty/Student roles
        $needsProfileCompletion = $isFaculty || $isStudent;

        if ($isFaculty) {
            // Lookup faculty by email
            $faculty = $this->facultyService->findByEmail($userData['email']);
            if (!$faculty) {
                return back()->withErrors([
                    'email' => 'This email is not registered in the faculty database. Assigning Faculty role requires a matching faculty email.'
                ]);
            }
            $userData['faculty_id'] = $faculty->faculty_id;
            $userData['first_name'] = $faculty->first_name;
            $userData['middle_name'] = $faculty->middle_name;
            $userData['last_name'] = $faculty->last_name;
        } else {
            $userData['faculty_id'] = null;
        }

        // If Student role, allow student_id to be set/edited. Otherwise, clear it.
        if (!$isStudent) {
            $userData['student_id'] = null;
        }

        try {
            // Set audit metadata before user creation
            UserObserver::$customMetadata = [
                'source' => UserAuditLog::SOURCE_ADMIN_CREATED,
                'context' => UserAuditLog::CONTEXT_USER_REGISTRATION,
                'note' => 'Account created',
            ];

            // Create user with admin-created flags
            $user = User::create([
                ...$userData,
                'created_by_admin' => true,
                'profile_completed' => !$needsProfileCompletion,
                'first_login_completed' => false,
                'password' => null,
                'email_verified_at' => null,
            ]);

            // Attach roles after user creation
            if (!empty($roleIds)) {
                $user->roles()->attach($roleIds);
            }

            // Send account creation email immediately
            try {
                Mail::to($user->email)->send(new AccountCreatedMail($user));
                $mailSent = true;
            } catch (\Throwable $mailException) {
                \Log::warning('Account creation email failed', [
                    'message' => $mailException->getMessage(),
                    'email' => $user->email,
                    'user_id' => $user->id,
                ]);
            }

        } catch (\Throwable $e) {
            \Log::error('User store failed', [
                'message' => $e->getMessage(),
                'data' => $userData,
                'role_ids' => $roleIds,
            ]);
            throw $e;
        }

        $response = redirect()->route('users.index')
            ->with('success', 'User created successfully.');

        if ($mailSent) {
            return $response->with('success', 'User created successfully. Account creation email has been sent.');
        }

        return $response->with('warning', 'User created successfully, but the account creation email could not be sent. Please check SMTP credentials or mail configuration.');
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        return Inertia::render('users/edit', [
            'user' => $user->load('roles'),
            'roles' => $this->userRepository->getAllRoles(),
            'auditLogs' => $this->userRepository->getAuditLogs($user),
            'adminCount' => $this->userRepository->getAdministratorCount(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $userData = $request->validated();
        $roleIds = $userData['role_ids'];
        unset($userData['role_ids']);

        // Capture original state before changes
        $originalData = $user->getAttributes();
        $originalRoles = $user->roles->pluck('name', 'id')->toArray();

        // Determine if Faculty role is being assigned
        $isFaculty = false;
        foreach ($roleIds as $roleId) {
            $role = \App\Models\Role::find($roleId);
            if ($role && $role->name === 'Faculty') {
                $isFaculty = true;
                break;
            }
        }

        if ($isFaculty) {
            // Lookup faculty by email
            $faculty = $this->facultyService->findByEmail($userData['email']);
            if (!$faculty) {
                return back()->withErrors([
                    'email' => 'This email is not registered in the faculty database. Assigning Faculty role requires a matching faculty email.'
                ]);
            }
            $userData['faculty_id'] = $faculty->faculty_id;
        } else {
            $userData['faculty_id'] = null;
        }

        // If Student role, allow student_id to be set/edited. Otherwise, clear it.
        $isStudent = false;
        foreach ($roleIds as $roleId) {
            $role = \App\Models\Role::find($roleId);
            if ($role && $role->name === 'Student') {
                $isStudent = true;
                break;
            }
        }
        if (!$isStudent) {
            $userData['student_id'] = null;
        }

        // Update user attributes
        $user->update($userData);
        
        // Sync roles and capture changes
        $syncResult = $user->roles()->sync($roleIds);
        
        // Check if roles changed (attached, detached, or updated)
        $rolesChanged = !empty($syncResult['attached']) || !empty($syncResult['detached']) || !empty($syncResult['updated']);
        
        if ($rolesChanged) {
            // Fallback: log role changes explicitly to ensure audit capture even if pivot events are missed
            // Qualify columns to avoid ambiguous column errors on SQLite when plucking with pivot joins
            // Reload roles to reflect the synced state
            $newRoles = $user->roles()
                ->select('roles.id', 'roles.name')
                ->pluck('roles.name', 'roles.id')
                ->toArray();
            $addedRoles = Role::whereIn('id', $syncResult['attached'] ?? [])->pluck('name', 'id')->toArray();
            $removedRoles = Role::whereIn('id', $syncResult['detached'] ?? [])->pluck('name', 'id')->toArray();

            app(AuditLogService::class)->logUserRoleChange(
                $user,
                $originalRoles,
                $newRoles,
                $addedRoles,
                $removedRoles
            );
        }

        return redirect()->route('users.index')
            ->with('success', 'User updated successfully');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);
        $user->delete();
       
        return redirect()->route('users.index')
            ->with('success', 'User deleted successfully');
    }

    /**
     * Restore a soft-deleted user account.
     */
    public function restore(User $user): RedirectResponse
    {
        $this->authorize('restore', $user);
        $user->restore();
       
        return redirect()->route('users.index')
            ->with('success', 'User restored successfully');
    }
}