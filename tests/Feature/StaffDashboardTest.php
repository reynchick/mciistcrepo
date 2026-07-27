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
            ->has('facultyCharts.advisedIds')
            ->has('facultyCharts.advisedLabels')
            ->has('facultyCharts.advisedCounts')
            ->has('facultyCharts.paneledIds')
            ->has('facultyCharts.paneledLabels')
            ->has('facultyCharts.paneledCounts')
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
            // Each chart includes only faculty with non-zero values for that metric.
            ->where('facultyCharts.advisedLabels', ['Ada Adams'])
            ->where('facultyCharts.advisedCounts', [2])
            ->where('facultyCharts.advisedIds', [$ada->id])
            ->where('facultyCharts.paneledLabels', ['Bob Baker'])
            ->where('facultyCharts.paneledCounts', [1])
            ->where('facultyCharts.paneledIds', [$bob->id])
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

test('staff dashboard filters summary and charts by year only', function () {
    $facultyA = staffDashFaculty('Ada', 'Adams');
    $facultyB = staffDashFaculty('Bob', 'Baker');
    $programA = Program::create(['name' => 'Program A']);
    $programB = Program::create(['name' => 'Program B']);

    staffDashResearch(['research_adviser' => $facultyA->id, 'program_id' => $programA->id, 'published_year' => 2023]);
    staffDashResearch(['research_adviser' => $facultyA->id, 'program_id' => $programB->id, 'published_year' => 2024]);
    staffDashResearch(['research_adviser' => $facultyB->id, 'program_id' => $programA->id, 'published_year' => 2024]);

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard', ['year' => [2024]]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.totalFaculty', 2)
            ->where('summary.totalResearch', 2)
            ->where('facultyCharts.advisedLabels', ['Ada Adams', 'Bob Baker'])
            ->where('facultyCharts.advisedCounts', [1, 1])
            ->where('facultyCharts.advisedIds', [$facultyA->id, $facultyB->id])
            ->where('facultyCharts.paneledLabels', [])
            ->where('facultyCharts.paneledCounts', [])
            ->where('facultyCharts.paneledIds', [])
        );
});

test('staff dashboard includes panelist-only faculty and adviser-less research in the selected year', function () {
    $adviser = staffDashFaculty('Ada', 'Adams');
    $panelist = staffDashFaculty('Bob', 'Baker');

    staffDashResearch(['research_adviser' => $adviser->id, 'published_year' => 2024]);
    $researchWithoutAdviser = staffDashResearch(['published_year' => 2024]);
    $researchWithoutAdviser->panelists()->attach($panelist->id);

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard', ['year' => [2024]]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.totalFaculty', 2)
            ->where('summary.totalResearch', 2)
            ->where('facultyCharts.advisedLabels', ['Ada Adams'])
            ->where('facultyCharts.advisedCounts', [1])
            ->where('facultyCharts.advisedIds', [$adviser->id])
            ->where('facultyCharts.paneledLabels', ['Bob Baker'])
            ->where('facultyCharts.paneledCounts', [1])
            ->where('facultyCharts.paneledIds', [$panelist->id])
        );
});

test('staff dashboard chart counts match the faculty relationship counts for each faculty', function () {
    $faculty = staffDashFaculty('Test', 'Faculty');
    $research = staffDashResearch(['research_adviser' => $faculty->id]);
    $research->panelists()->attach($faculty->id);

    $response = $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard'));

    $page = $response->original->getData();
    $payload = $page['page']['props']['facultyCharts'];

    $advisedIndex = array_search($faculty->id, $payload['advisedIds'], true);
    $paneledIndex = array_search($faculty->id, $payload['paneledIds'], true);

    expect($advisedIndex)->not->toBeFalse();
    expect($paneledIndex)->not->toBeFalse();
    expect($payload['advisedCounts'][$advisedIndex])->toBe($faculty->getActiveResearchCounts()['advised']);
    expect($payload['paneledCounts'][$paneledIndex])->toBe($faculty->getActiveResearchCounts()['paneled']);
});

test('advised chart stays empty when only paneled research exists for the selected year', function () {
    $panelist = staffDashFaculty('Bob', 'Baker');
    $research = staffDashResearch(['published_year' => 2024]);
    $research->panelists()->attach($panelist->id);

    $this->actingAs(staffDashUser())
        ->get(route('staff.dashboard', ['year' => [2024]]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('facultyCharts.advisedLabels', [])
            ->where('facultyCharts.advisedCounts', [])
            ->where('facultyCharts.advisedIds', [])
            ->where('facultyCharts.paneledLabels', ['Bob Baker'])
            ->where('facultyCharts.paneledCounts', [1])
            ->where('facultyCharts.paneledIds', [$panelist->id])
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

test('faculty users see the faculty dashboard with their own scoped counts', function () {
    $faculty = Faculty::create([
        'faculty_id' => uniqid('F'),
        'first_name' => 'Ada',
        'last_name' => 'Lovelace',
    ]);
    $user = User::factory()->asFaculty()->create([
        'profile_completed' => true,
        'faculty_id' => $faculty->faculty_id,
    ]);

    $program = Program::create(['name' => 'Program A']);
    staffDashResearch(['research_adviser' => $faculty->id, 'program_id' => $program->id, 'published_year' => 2023]);
    staffDashResearch(['research_adviser' => $faculty->id, 'program_id' => $program->id, 'published_year' => 2024]);

    $research = staffDashResearch(['program_id' => $program->id, 'published_year' => 2024]);
    $research->panelists()->attach($faculty->id);

    $this->actingAs($user)
        ->get(route('dashboard', ['year' => [2024]]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/faculty/index')
            ->where('facultyStats.totals.advised', 1)
            ->where('facultyStats.totals.paneled', 1)
            ->where('facultyStats.yearlyTrendAdvised.0.year', 2024)
            ->where('facultyStats.yearlyTrendPaneled.0.year', 2024)
        );
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

/**
 * Regression: the seeded admin also holds the MCIIS Staff role. Routing must
 * key off the role they are acting as, not any role they merely hold, or the
 * admin dashboard wrongly redirects to the staff dashboard.
 */
function multiRoleAdmin(): User
{
    $admin = User::factory()->asAdministrator()->create(['profile_completed' => true]);
    $staffRole = \App\Models\Role::firstOrCreate(['name' => 'MCIIS Staff']);
    $admin->roles()->syncWithoutDetaching([$staffRole->id]); // Administrator stays first -> active role
    return $admin;
}

test('an admin who also holds the staff role lands on the admin dashboard', function () {
    $this->actingAs(multiRoleAdmin())
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/admin/index'));
});

test('a multi-role admin visiting the staff dashboard url is sent to their admin dashboard', function () {
    $this->actingAs(multiRoleAdmin())
        ->get(route('staff.dashboard'))
        ->assertRedirect(route('dashboard'));
});

test('a multi-role admin acting as staff sees the staff dashboard', function () {
    $this->actingAs(multiRoleAdmin())
        ->withSession(['active_role' => 'MCIIS Staff'])
        ->get(route('staff.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard/staff/index'));
});

test('a multi-role admin acting as staff is redirected from the shared dashboard to staff', function () {
    $this->actingAs(multiRoleAdmin())
        ->withSession(['active_role' => 'MCIIS Staff'])
        ->get(route('dashboard'))
        ->assertRedirect(route('staff.dashboard'));
});
