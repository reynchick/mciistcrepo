<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use App\Models\Research;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff Research Analytics Dashboard.
 *
 * Read-only overview for MCIIS Staff: college-wide totals plus the top 5
 * research advisers and panelists. Access is gated by the `role:MCIIS Staff`
 * middleware on the route (see routes/web.php).
 */
class StaffDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        // Timestamp of the most recent research update; null when there is no
        // research yet. Formatted for display client-side.
        $lastUpdated = Research::max('updated_at');

        return Inertia::render('dashboard/staff/index', [
            'summary' => [
                // Active faculty only — SoftDeletes already excludes deleted_at.
                'totalFaculty' => Faculty::count(),
                // Active research only — matches the app-wide archived_at IS NULL filter.
                'totalResearch' => Research::whereNull('archived_at')->count(),
                'lastUpdated' => $lastUpdated ? (string) $lastUpdated : null,
            ],
            'topAdvisers' => $this->topAdvisers(),
            'topPanelists' => $this->topPanelists(),
        ]);
    }

    /**
     * Top 5 faculty by number of active researches they advise.
     */
    private function topAdvisers(): array
    {
        return Faculty::query()
            ->withCount(['advisedResearches' => fn ($q) => $q->whereNull('archived_at')])
            ->orderByDesc('advised_researches_count')
            ->orderBy('last_name')
            ->limit(5)
            ->get()
            ->filter(fn (Faculty $f) => $f->advised_researches_count > 0)
            ->map(fn (Faculty $f) => [
                'id' => $f->id,
                'name' => $f->full_name,
                'count' => $f->advised_researches_count,
            ])
            ->values()
            ->all();
    }

    /**
     * Top 5 faculty by number of active researches they paneled.
     *
     * The `panels` pivot is what populates this; on a freshly seeded database
     * that table can be empty, in which case the client renders the empty state.
     */
    private function topPanelists(): array
    {
        return Faculty::query()
            ->withCount(['paneledResearch' => fn ($q) => $q->whereNull('archived_at')])
            ->orderByDesc('paneled_research_count')
            ->orderBy('last_name')
            ->limit(5)
            ->get()
            ->filter(fn (Faculty $f) => $f->paneled_research_count > 0)
            ->map(fn (Faculty $f) => [
                'id' => $f->id,
                'name' => $f->full_name,
                'count' => $f->paneled_research_count,
            ])
            ->values()
            ->all();
    }
}
