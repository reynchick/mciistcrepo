<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use App\Models\Research;
use App\Repositories\ResearchRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
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
    public function __construct(protected ResearchRepository $researchRepository)
    {
    }

    public function index(Request $request): Response|RedirectResponse
    {
        // The route's role:MCIIS Staff middleware already 403s anyone without the
        // staff role. A multi-role user who *has* the role but is acting as a
        // different one (e.g. an admin acting as Administrator) is sent to the
        // role-adaptive dashboard so they see the view for their active role.
        if (! $request->user()?->isActingAs('MCIIS Staff')) {
            return redirect()->route('dashboard');
        }

        $filters = $this->normalizeFilters($request);

        // Independent single-year filters for each Top 5 widget's dropdown.
        // These are separate from the global `years[]` sidebar filter so a
        // staff member can, e.g., look at "Top 5 Advisers for 2024" while the
        // rest of the dashboard stays unfiltered (or filtered differently).
        $adviserYear = $request->filled('topAdviserYear') ? (int) $request->input('topAdviserYear') : null;
        $panelistYear = $request->filled('topPanelistYear') ? (int) $request->input('topPanelistYear') : null;

        // Timestamp of the most recent research update; null when there is no
        // research yet. Formatted for display client-side. This stays global and
        // is not affected by dashboard filters.
        $lastUpdated = Research::query()->whereNull('archived_at')->max('updated_at');

        return Inertia::render('dashboard/staff/index', [
            'summary' => [
                // Active faculty only — SoftDeletes already excludes deleted_at.
                'totalFaculty' => $this->totalFaculty($filters),
                // Active research only — matches the app-wide archived_at IS NULL filter.
                'totalResearch' => $this->totalResearch($filters),
                'lastUpdated' => $lastUpdated ? (string) $lastUpdated : null,
            ],
            'topAdvisers' => $this->topAdvisers($filters, $adviserYear),
            'topPanelists' => $this->topPanelists($filters, $panelistYear),
            'facultyCharts' => $this->facultyChartData($filters),
            'filters' => [
                'years' => $filters['years'],
                'topAdviserYear' => $adviserYear,
                'topPanelistYear' => $panelistYear,
            ],
            'filterOptions' => [
                'years' => $this->yearOptions(),
            ],
        ]);
    }

    private function normalizeFilters(Request $request): array
    {
        $years = collect((array) $request->input('year', []))
            ->flatten()
            ->map(fn ($value) => (int) $value)
            ->filter()
            ->values()
            ->all();

        return [
            'years' => $years,
        ];
    }

    private function activeResearchQuery(array $filters = []): Builder
    {
        $query = Research::query()->whereNull('archived_at');

        if (! empty($filters['years'])) {
            $query->whereIn('published_year', $filters['years']);
        }

        return $query;
    }

    private function matchingFacultyIds(array $filters = []): array
    {
        $query = Faculty::query()->whereNull('deleted_at');

        if (! empty($filters['years'])) {
            $query->where(function (Builder $facultyQuery) use ($filters): void {
                $facultyQuery->whereHas('advisedResearches', function (Builder $advisedQuery) use ($filters): void {
                    $advisedQuery->whereNull('archived_at');
                    $advisedQuery->whereIn('published_year', $filters['years']);
                })->orWhereHas('paneledResearch', function (Builder $panelQuery) use ($filters): void {
                    $panelQuery->whereNull('archived_at');
                    $panelQuery->whereIn('published_year', $filters['years']);
                });
            });
        }

        return $query->pluck('id')->all();
    }

    private function totalFaculty(array $filters = []): int
    {
        return count($this->matchingFacultyIds($filters));
    }

    private function totalResearch(array $filters = []): int
    {
        return (int) $this->activeResearchQuery($filters)->count();
    }

    private function yearOptions(): array
    {
        return $this->researchRepository
            ->yearOptions(true)
            ->values()
            ->all();
    }

    /**
     * Per-faculty advised / paneled counts for the two tables, including
     * contact/role info for display (email as subtext, position as
     * "position").
     *
     * Each list is built from faculty who actually have a non-zero count for
     * that specific metric in the current filter. This preserves the
     * empty-state behavior for tables with no matching data.
     */
    private function facultyChartData(array $filters = []): array
    {
        $query = Faculty::query()
            ->select('id', 'first_name', 'middle_name', 'last_name', 'email', 'position')
            ->whereNull('deleted_at');

        if (! empty($filters['years'])) {
            $query->whereIn('id', $this->matchingFacultyIds($filters));
        }

        $faculty = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $advisedFaculty = $faculty
            ->filter(fn (Faculty $f) => $f->getActiveResearchCounts($filters)['advised'] > 0)
            ->values();

        $paneledFaculty = $faculty
            ->filter(fn (Faculty $f) => $f->getActiveResearchCounts($filters)['paneled'] > 0)
            ->values();

        return [
            'advisedIds' => $advisedFaculty->map(fn (Faculty $f) => $f->id)->all(),
            'advisedLabels' => $advisedFaculty->map(fn (Faculty $f) => $f->full_name)->all(),
            'advisedEmails' => $advisedFaculty->map(fn (Faculty $f) => $f->email)->all(),
            'advisedPositions' => $advisedFaculty->map(fn (Faculty $f) => $f->position)->all(),
            'advisedCounts' => $advisedFaculty->map(fn (Faculty $f) => $f->getActiveResearchCounts($filters)['advised'])->all(),
            'paneledIds' => $paneledFaculty->map(fn (Faculty $f) => $f->id)->all(),
            'paneledLabels' => $paneledFaculty->map(fn (Faculty $f) => $f->full_name)->all(),
            'paneledEmails' => $paneledFaculty->map(fn (Faculty $f) => $f->email)->all(),
            'paneledPositions' => $paneledFaculty->map(fn (Faculty $f) => $f->position)->all(),
            'paneledCounts' => $paneledFaculty->map(fn (Faculty $f) => $f->getActiveResearchCounts($filters)['paneled'])->all(),
        ];
    }

    /**
     * Top 5 faculty by number of active researches they advise.
     *
     * When $year is given (from the widget's own year dropdown) it takes
     * precedence over the global `years[]` filter for this metric only.
     */
    private function topAdvisers(array $filters = [], ?int $year = null): array
    {
        $query = Faculty::query()
            ->whereNull('deleted_at');

        if (! empty($filters['years'])) {
            $query->whereIn('id', $this->matchingFacultyIds($filters));
        }

        return $query
            ->withCount(['advisedResearches' => function (Builder $query) use ($filters, $year): void {
                $query->whereNull('archived_at');

                if ($year !== null) {
                    $query->where('published_year', $year);
                } elseif (! empty($filters['years'])) {
                    $query->whereIn('published_year', $filters['years']);
                }
            }])
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
     * When $year is given it takes precedence over the global `years[]` filter
     * for this metric only.
     */
    private function topPanelists(array $filters = [], ?int $year = null): array
    {
        $query = Faculty::query()
            ->whereNull('deleted_at');

        if (! empty($filters['years'])) {
            $query->whereIn('id', $this->matchingFacultyIds($filters));
        }

        return $query
            ->withCount(['paneledResearch' => function (Builder $query) use ($filters, $year): void {
                $query->whereNull('archived_at');

                if ($year !== null) {
                    $query->where('published_year', $year);
                } elseif (! empty($filters['years'])) {
                    $query->whereIn('published_year', $filters['years']);
                }
            }])
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