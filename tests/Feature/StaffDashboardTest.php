<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function staffDashUser(): User
{
    return User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
}

function staffDashFaculty(string $first = 'Test', string $last = 'Faculty', array $overrides = []): Faculty
{
    return Faculty::create(array_merge([
        'faculty_id' => uniqid('F'),
        'first_name' => $first,
        'last_name' => $last,
    ], $overrides));
}

/**
 * Build a Research row directly (bypassing ResearchFactory, whose afterCreating
 * attaches random panelists and would make ranking assertions non-deterministic).
 */
function staffDashResearch(array $overrides = []): Research
{
    return Research::create(array_merge([
        'uploaded_by' => $overrides['uploaded_by'] ?? User::factory()->create()->id,
        'research_title' => 'Research '.uniqid(),
        'program_id' => $overrides['program_id'] ?? Program::create(['name' => 'Program '.uniqid()])->id,
        'published_year' => 2024,
        'research_abstract' => 'Abstract',
        'archived_at' => null,
    ], $overrides));
}

test('staff can view the staff research analytics dashboard', function () {
    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/staff/index')
            ->has('summary')
            ->has('topAdvisers')
            ->has('topPanelists')
            ->has('facultyCharts.ids')
            ->has('facultyCharts.labels')
            ->has('facultyCharts.advised')
            ->has('facultyCharts.paneled')
        );
});

test('faculty charts include every active faculty (zeros included) with aligned axes', function () {
    $ada = staffDashFaculty('Ada', 'Adams');   // advises 2, panels 0
    $bob = staffDashFaculty('Bob', 'Baker');   // advises 0, panels 1
    $cy = staffDashFaculty('Cy', 'Carter');    // 0 / 0 -> still present
    staffDashFaculty('Zed', 'Zephyr')->delete(); // soft-deleted -> excluded

    staffDashResearch(['research_adviser' => $ada->id]);
    staffDashResearch(['research_adviser' => $ada->id]);
    staffDashResearch(['archived_at' => now(), 'research_adviser' => $ada->id]); // archived -> not counted
    staffDashResearch()->panelists()->attach($bob->id);

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            // Alphabetical by last name; soft-deleted excluded; both axes identical.
            ->where('facultyCharts.labels', ['Ada Adams', 'Bob Baker', 'Cy Carter'])
            ->where('facultyCharts.advised', [2, 0, 0])
            ->where('facultyCharts.paneled', [0, 1, 0])
            ->where('facultyCharts.ids', [$ada->id, $bob->id, $cy->id])
        );
});

test('staff dashboard reports the active faculty and research counts', function () {
    staffDashFaculty('A', 'One');
    staffDashFaculty('B', 'Two');
    staffDashFaculty('C', 'Three');
    staffDashFaculty('D', 'Four');
    staffDashFaculty('E', 'Deleted')->delete(); // soft-deleted -> excluded

    staffDashResearch();
    staffDashResearch();
    staffDashResearch();
    staffDashResearch(['archived_at' => now()]); // archived -> excluded

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.totalFaculty', 4)
            ->where('summary.totalResearch', 3)
            ->where('summary.totalFaculty', Faculty::count())
        );
});

test('top advisers are ranked by advised active research', function () {
    $top = staffDashFaculty('Ada', 'Lovelace');
    $other = staffDashFaculty('Alan', 'Turing');

    staffDashResearch(['research_adviser' => $top->id]);
    staffDashResearch(['research_adviser' => $top->id]);
    staffDashResearch(['research_adviser' => $top->id]);
    staffDashResearch(['research_adviser' => $other->id]);
    staffDashResearch(['research_adviser' => $top->id, 'archived_at' => now()]); // archived -> not counted

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('topAdvisers.0.name', 'Ada Lovelace')
            ->where('topAdvisers.0.count', 3)
            ->where('topAdvisers.1.name', 'Alan Turing')
            ->where('topAdvisers.1.count', 1)
        );
});

test('top panelists reflect the panels pivot', function () {
    $panelist = staffDashFaculty('Grace', 'Hopper');
    $research = staffDashResearch();
    $research->panelists()->attach($panelist->id);

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('topPanelists.0.name', 'Grace Hopper')
            ->where('topPanelists.0.count', 1)
        );
});

test('empty panels produce an empty top panelists list', function () {
    staffDashFaculty('No', 'Panels');

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('topPanelists', []));
});

test('staff visiting the admin dashboard are redirected to their own', function () {
    $this->actingAs(staffDashUser())
        ->get(route('dashboard'))
        ->assertRedirect(route('staff.dashboard'));
});

test('non-staff roles cannot access the staff dashboard', function () {
    foreach ([
        User::factory()->asFaculty()->create(['profile_completed' => true]),
        User::factory()->asStudent()->create(['profile_completed' => true]),
    ] as $user) {
        $this->actingAs($user)
            ->get(route('staff.dashboard'))
            ->assertForbidden();
    }
});

test('admin still lands on the admin dashboard', function () {
    $admin = User::factory()->asAdministrator()->create(['profile_completed' => true]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/admin/index'));
});
