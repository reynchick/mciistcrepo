<?php


namespace App\Http\Controllers;


use App\Models\Faculty;
use App\Http\Requests\StoreFacultyRequest;
use App\Http\Requests\UpdateFacultyRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;


class FacultyController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Faculty::class);
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Faculty::query()
            ->withCount(['advisedResearches' => function ($query) {
                $query->whereNull('archived_at');
            }])
            ->when($request->filled('search'), function ($query) use ($request) {
                $query->search($request->search);
            })
            ->when($request->filled('designation'), function ($query) use ($request) {
                $query->where('designation', $request->designation);
            });
           
        $faculties = $query->paginate(15);


        return Inertia::render('faculty/index', [
            'faculties' => $faculties,
            'filters' => $request->only(['search', 'designation'])
        ]);
    }


    /**
     * Display the specified resource.
     */
    public function show(Faculty $faculty): Response
    {
        $faculty->load(['advisedResearches' => function ($query) {
            $query->with(['program', 'researchers', 'keywords'])
                  ->latest();
        }]);


        return Inertia::render('faculty/show', [
            'faculty' => $faculty
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('faculty/create');
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreFacultyRequest $request)
    {
        $faculty = Faculty::create($request->validated());
       
        return redirect()->route('faculty.show', $faculty)
            ->with('success', 'Faculty member created successfully.');
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Faculty $faculty): Response
    {
        return Inertia::render('faculty/edit', [
            'faculty' => $faculty
        ]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateFacultyRequest $request, Faculty $faculty)
    {
        $faculty->update($request->validated());


        return redirect()->route('faculty.show', $faculty)
            ->with('success', 'Faculty member updated successfully.');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Faculty $faculty)
    {
        // Check for advised researches
        if ($faculty->advisedResearches()->count() > 0) {
            return $this->error('Cannot delete faculty member with existing research advising.');
        }
       
        // Check for paneled research
        if ($faculty->paneledResearch()->count() > 0) {
            return $this->error('Cannot delete faculty member assigned as panelist to research.');
        }
       
        // Check for linked user account
        if ($faculty->user()->exists()) {
            return $this->error('Cannot delete faculty member with linked user account.');
        }


        $faculty->delete();
       
        return redirect()->route('faculty.index')
            ->with('success', 'Faculty member deleted successfully.');
    }

    /**
     * Find faculty by email for user creation.
     */
    public function findByEmail(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->isAdministrator()) {
            abort(403, 'Unauthorized');
        }

        $email = strtolower(trim((string) $request->query('email')));

        if ($email === '') {
            return response()->json(['message' => 'Email is required'], 422);
        }

        $faculty = Faculty::whereRaw('LOWER(email) = ?', [strtolower(trim($email))])->first();

        if (!$faculty) {
            return response()->json(['exists' => false]);
        }

        return response()->json([
            'exists' => true,
            'faculty_id' => $faculty->faculty_id,
            'first_name' => $faculty->first_name,
            'middle_name' => $faculty->middle_name,
            'last_name' => $faculty->last_name,
        ]);
    }


    /**
     * Bulk delete faculty members.
     */
    public function bulkDestroy(\Illuminate\Http\Request $request)
    {
        $this->authorize('create', Faculty::class); // Only admins can bulk delete
       
        $facultyIds = $request->input('faculty_ids', []);
       
        if (empty($facultyIds)) {
            return back()->with('error', 'No faculty members selected.');
        }


        $deleted = 0;
        $errors = [];


        foreach ($facultyIds as $id) {
            $faculty = Faculty::find($id);
           
            if (!$faculty) {
                continue;
            }


            // Check constraints
            if ($faculty->advisedResearches()->count() > 0 ||
                $faculty->paneledResearch()->count() > 0 ||
                $faculty->user()->exists()) {
                $errors[] = "{$faculty->first_name} {$faculty->last_name} cannot be deleted due to existing relationships.";
                continue;
            }


            $faculty->delete();
            $deleted++;
        }


        if ($deleted > 0 && empty($errors)) {
            return back()->with('success', "{$deleted} faculty member(s) deleted successfully.");
        } elseif ($deleted > 0 && !empty($errors)) {
            return back()->with('warning', "{$deleted} faculty member(s) deleted. Some could not be deleted: " . implode(', ', $errors));
        } else {
            return back()->with('error', 'No faculty members could be deleted: ' . implode(', ', $errors));
        }
    }
}