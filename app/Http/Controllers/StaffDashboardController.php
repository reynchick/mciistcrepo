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
            'facultyCharts' => $this->facultyChartData(),
        ]);
    }

    /**
     * Per-faculty advised / paneled counts for the two bar charts.
     *
     * Every active faculty member is included (soft-deleted excluded) — even
     * those with zero counts — so both charts share an identical x-axis. Counts
     * cover active research only (archived_at IS NULL). Ordered alphabetically
     * by name, matching how faculty are listed elsewhere in the app.
     */
    private function facultyChartData(): array
    {
        $faculty = Faculty::query()
            ->select('id', 'first_name', 'middle_name', 'last_name')
            ->withCount([
                'advisedResearches as advised_count' => fn ($q) => $q->whereNull('archived_at'),
                'paneledResearch as paneled_count' => fn ($q) => $q->whereNull('archived_at'),
            ])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return [
            // Index-aligned arrays: ids power bar click-through to /research filters.
            'ids' => $faculty->map(fn (Faculty $f) => $f->id)->all(),
            'labels' => $faculty->map(fn (Faculty $f) => $f->full_name)->all(),
            'advised' => $faculty->map(fn (Faculty $f) => (int) $f->advised_count)->all(),
            'paneled' => $faculty->map(fn (Faculty $f) => (int) $f->paneled_count)->all(),
        ];
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
