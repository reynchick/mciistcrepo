<?php

namespace App\Http\Controllers;

use App\Models\Research;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResearchMatrixController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Display the research matrix report page.
     */
    public function index(Request $request): Response
    {
        $query = Research::query()
            ->with([
                'program',
                'adviser',
                'researchers',
                'sdgs',
                'srigs',
                'agendas'
            ])
            ->whereNull('archived_at');

        // Apply filters
        if ($request->filled('program')) {
            $query->where('program_id', $request->input('program'));
        }

        if ($request->filled('year')) {
            $query->where('published_year', $request->input('year'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('research_title', 'like', "%{$search}%")
                    ->orWhere('research_abstract', 'like', "%{$search}%")
                    ->orWhereHas('researchers', function ($rq) use ($search) {
                        $rq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('adviser', function ($aq) use ($search) {
                        $aq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $researches = $query->orderBy('program_id')
            ->orderBy('published_year', 'desc')
            ->get();

        $programs = Program::orderBy('name')->get();

        // Debug info
        \Log::info('Reports & Analytics Page', [
            'total_researches' => Research::count(),
            'active_researches' => Research::whereNull('archived_at')->count(),
            'filtered_count' => $researches->count(),
            'programs_count' => $programs->count(),
            'filters' => $request->all()
        ]);

        return Inertia::render('reports/Matrix', [
            'researches' => $researches,
            'programs' => $programs,
            'filters' => [
                'program' => $request->input('program'),
                'year' => $request->input('year'),
                'search' => $request->input('search'),
            ]
        ]);
    }
}
