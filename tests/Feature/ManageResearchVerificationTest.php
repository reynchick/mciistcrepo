<?php

use App\Models\Faculty;
use App\Enums\ResearchStatus;
use App\Models\Keyword;
use App\Models\Program;
use App\Models\Research;
use App\Models\Role;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function makeFaculty(string $facultyId): Faculty
{
    return Faculty::create([
        'faculty_id' => $facultyId,
        'first_name' => 'Test',
        'last_name' => 'Faculty-' . $facultyId,
    ]);
}

function seedManageResearchFixtures(): array
{
    $program = Program::factory()->create(['name' => 'BS Computer Science', 'code' => 'BSCS']);
    $adviser = makeFaculty('ADV-' . uniqid());
    $research = Research::factory()->create([
        'research_title' => 'Verification Research Title',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
    ]);
    $research->researchers()->create(['first_name' => 'Jane', 'last_name' => 'Doe', 'email' => 'jd@usep.edu.ph']);
    $keyword = Keyword::create(['keyword_name' => 'ExistingKeyword']);
    $research->keywords()->attach($keyword->id);

    return compact('program', 'adviser', 'research');
}

function seedResearchWithStoredFiles(): array
{
    $fixtures = seedManageResearchFixtures();
    $research = $fixtures['research'];

    $approvalPath = 
        \Illuminate\Http\UploadedFile::fake()->create('existing-approval.pdf', 120, 'application/pdf')
            ->store('research/approval_sheets', 'public');
    $manuscriptPath = 
        \Illuminate\Http\UploadedFile::fake()->create('existing-manuscript.pdf', 140, 'application/pdf')
            ->store('research/manuscripts', 'public');

    $research->update([
        'research_approval_sheet' => $approvalPath,
        'research_manuscript' => $manuscriptPath,
    ]);

    return [
        ...$fixtures,
        'approval_path' => $approvalPath,
        'manuscript_path' => $manuscriptPath,
    ];
}

test('guests are redirected away from manage research', function () {
    $this->get('/staff/research')->assertRedirect('/login');
});

test('students cannot access manage research', function () {
    $student = User::factory()->asStudent()->create(['profile_completed' => true]);
    $this->actingAs($student)->get('/staff/research')->assertForbidden();
});

test('faculty cannot access manage research', function () {
    $faculty = User::factory()->asFaculty()->create(['profile_completed' => true]);
    $this->actingAs($faculty)->get('/staff/research')->assertForbidden();
});

test('mciis staff can view the manage research table with adviser data', function () {
    ['research' => $research, 'adviser' => $adviser] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->get('/staff/research')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('staff/research/index')
            ->has('researches.data', 1)
            ->where('researches.data.0.id', $research->id)
            ->where('researches.data.0.research_title', 'Verification Research Title')
            ->where('researches.data.0.program.name', 'BS Computer Science')
            ->where('researches.data.0.adviser.id', $adviser->id)
            ->where('researches.data.0.status', $research->status->value)
            ->has('agendas')
            ->has('sdgs')
            ->has('srigs')
        );
});

test('staff can filter manage research by every workflow status', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $research->update(['status' => ResearchStatus::DRAFT_INVITED]);
    Research::factory()->create(['status' => ResearchStatus::POSTED]);
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->get('/staff/research?status=draft_invited')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.status', 'draft_invited')
            ->has('researches.data', 1)
            ->where('researches.data.0.id', $research->id)
            ->where('researches.data.0.status', 'draft_invited')
        );
});

test('staff archives research without deleting its record or files', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    ['research' => $research] = seedManageResearchFixtures();
    $path = \Illuminate\Http\UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf')
        ->store('research/manuscripts', 'public');
    $research->update(['status' => ResearchStatus::POSTED, 'research_manuscript' => $path]);
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->from('/staff/research')->post("/research/{$research->id}/archive", [
        'reason' => 'Superseded record',
    ])->assertSessionHasNoErrors()->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->exists)->toBeTrue()
        ->and($research->status)->toBe(ResearchStatus::ARCHIVED)
        ->and($research->archived_at)->not->toBeNull()
        ->and($research->archive_reason)->toBe('Superseded record');
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($path);

    $this->actingAs($staff)->get('/staff/research')
        ->assertInertia(fn ($page) => $page->component('staff/research/index')->has('researches.data', 0));
});

test('staff upload records explicit unavailable markers for panelists and documents', function () {
    $program = Program::factory()->create();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->post('/research', [
        'workflow_action' => 'draft',
        'research_title' => 'Unavailable Fields Research',
        'program_id' => $program->id,
        'panelists_unavailable' => true,
        'approval_sheet_unavailable' => true,
        'manuscript_unavailable' => true,
    ])->assertSessionHasNoErrors();

    $research = Research::where('research_title', 'Unavailable Fields Research')->firstOrFail();
    expect($research->panelists_unavailable)->toBeTrue()
        ->and($research->approval_sheet_unavailable)->toBeTrue()
        ->and($research->manuscript_unavailable)->toBeTrue()
        ->and($research->panelists()->count())->toBe(0)
        ->and($research->research_approval_sheet)->toBeNull()
        ->and($research->research_manuscript)->toBeNull();
});

test('search filters by title, id, and program', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->get('/staff/research?search=Verification')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('researches.data', 1));

    $this->actingAs($staff)->get('/staff/research?search=' . $research->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('researches.data', 1));

    $this->actingAs($staff)->get('/staff/research?search=BSCS')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('researches.data', 1));

    $this->actingAs($staff)->get('/staff/research?search=NoSuchThingAtAll')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('researches.data', 0));
});

test('edit data endpoint returns raw editable attributes', function () {
    ['research' => $research, 'program' => $program, 'adviser' => $adviser] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $json = $this->actingAs($staff)->getJson("/research/{$research->id}/edit-data")
        ->assertOk()
        ->assertJsonPath('data.id', $research->id)
        ->assertJsonPath('data.research_title', 'Verification Research Title')
        ->assertJsonPath('data.program_id', $program->id)
        ->assertJsonPath('data.research_adviser', $adviser->id)
        ->json('data');

    expect($json['keyword_names'])->toContain('ExistingKeyword');
    expect(collect($json['researchers'])->pluck('first_name'))->toContain('Jane');
});

test('edit data endpoint is not cacheable', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->getJson("/research/{$research->id}/edit-data")
        ->assertOk()
        ->assertHeader('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store, private');
});

test('staff can load the full editor data for a posted research', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $research->update(['status' => ResearchStatus::POSTED]);
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->getJson("/research/{$research->id}/edit-data")
        ->assertOk()
        ->assertJsonPath('data.id', $research->id)
        ->assertJsonPath('data.status', 'posted')
        ->assertJsonPath('data.research_title', $research->research_title);
});

test('staff save keeps an incomplete draft as draft with only title and program', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $research->update([
        'status' => ResearchStatus::DRAFT,
        'completed_month' => null,
        'completed_year' => null,
        'research_abstract' => null,
    ]);
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->from('/staff/research')->put("/research/{$research->id}", [
        'workflow_action' => 'staff_save',
        'research_title' => 'Still a Draft',
        'program_id' => $research->program_id,
    ])->assertSessionHasNoErrors()->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->status)->toBe(ResearchStatus::DRAFT)
        ->and($research->research_title)->toBe('Still a Draft');
});

test('staff can update all research attributes and see them persisted', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $newProgram = Program::factory()->create(['name' => 'BS Information Technology', 'code' => 'BSIT']);
    $newAdviser = makeFaculty('NEWADV-' . uniqid());
    $panelist = makeFaculty('PANEL-' . uniqid());

    $response = $this->actingAs($staff)->from('/staff/research')->put("/research/{$research->id}", [
        'research_title' => 'Updated Research Title',
        'program_id' => $newProgram->id,
        'research_adviser' => $newAdviser->id,
        'completed_month' => 6,
        'completed_year' => 2024,
        'research_abstract' => 'Updated abstract text.',
        'researchers' => [
            ['first_name' => 'John', 'last_name' => 'Smith', 'email' => 'js@usep.edu.ph'],
        ],
        'keywords' => ['NewKeyword', 'AnotherKeyword'],
        'panelists' => [$panelist->id],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->research_title)->toBe('Updated Research Title');
    expect($research->program_id)->toBe($newProgram->id);
    expect($research->research_adviser)->toBe($newAdviser->id);
    expect($research->completed_month)->toBe(6);
    expect($research->completed_year)->toBe(2024);
    expect($research->research_abstract)->toBe('Updated abstract text.');

    expect($research->researchers()->count())->toBe(1);
    expect($research->researchers()->first()->first_name)->toBe('John');

    expect($research->keywords()->pluck('keyword_name')->sort()->values()->all())
        ->toBe(['AnotherKeyword', 'NewKeyword']);

    expect($research->panelists()->pluck('faculties.id')->all())->toBe([$panelist->id]);
});

test('removing the approval sheet clears the stored file and keeps the manuscript intact', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    ['research' => $research, 'approval_path' => $approvalPath, 'manuscript_path' => $manuscriptPath] = seedResearchWithStoredFiles();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $existingResearcher = $research->researchers()->firstOrFail();

    $response = $this->actingAs($staff)->from('/staff/research')->post("/research/{$research->id}", [
        '_method' => 'put',
        'research_title' => $research->research_title,
        'program_id' => $research->program_id,
        'research_adviser' => $research->research_adviser,
        'published_year' => $research->published_year,
        'research_abstract' => $research->research_abstract,
        'researchers' => [
            ['id' => $existingResearcher->id, 'first_name' => $existingResearcher->first_name, 'last_name' => $existingResearcher->last_name, 'email' => $existingResearcher->email],
        ],
        'keywords' => $research->keywords()->pluck('keyword_name')->all(),
        'clear_research_approval_sheet' => true,
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->research_approval_sheet)->toBeNull();
    expect($research->research_manuscript)->toBe($manuscriptPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($approvalPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($manuscriptPath);

    $json = $this->actingAs($staff)->getJson("/research/{$research->id}/edit-data")->json('data');
    expect($json['research_approval_sheet'])->toBeNull();
    expect($json['research_manuscript'])->toBe($manuscriptPath);
});

test('removing the manuscript and uploading a replacement saves the new file and deletes the old one', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    ['research' => $research, 'approval_path' => $approvalPath, 'manuscript_path' => $manuscriptPath] = seedResearchWithStoredFiles();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $existingResearcher = $research->researchers()->firstOrFail();
    $replacement = \Illuminate\Http\UploadedFile::fake()->create('replacement-manuscript.pdf', 150, 'application/pdf');

    $response = $this->actingAs($staff)->from('/staff/research')->post("/research/{$research->id}", [
        '_method' => 'put',
        'research_title' => $research->research_title,
        'program_id' => $research->program_id,
        'research_adviser' => $research->research_adviser,
        'published_year' => $research->published_year,
        'research_abstract' => $research->research_abstract,
        'researchers' => [
            ['id' => $existingResearcher->id, 'first_name' => $existingResearcher->first_name, 'last_name' => $existingResearcher->last_name, 'email' => $existingResearcher->email],
        ],
        'keywords' => $research->keywords()->pluck('keyword_name')->all(),
        'clear_research_manuscript' => true,
        'research_manuscript' => $replacement,
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->research_approval_sheet)->toBe($approvalPath);
    expect($research->research_manuscript)->not->toBe($manuscriptPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($approvalPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($manuscriptPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($research->research_manuscript);
});

test('removing the approval sheet and uploading a replacement saves the new file and deletes the old one', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    ['research' => $research, 'approval_path' => $approvalPath, 'manuscript_path' => $manuscriptPath] = seedResearchWithStoredFiles();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $existingResearcher = $research->researchers()->firstOrFail();
    $replacement = \Illuminate\Http\UploadedFile::fake()->create('replacement-approval.pdf', 150, 'application/pdf');

    $response = $this->actingAs($staff)->from('/staff/research')->post("/research/{$research->id}", [
        '_method' => 'put',
        'research_title' => $research->research_title,
        'program_id' => $research->program_id,
        'research_adviser' => $research->research_adviser,
        'published_year' => $research->published_year,
        'research_abstract' => $research->research_abstract,
        'researchers' => [
            ['id' => $existingResearcher->id, 'first_name' => $existingResearcher->first_name, 'last_name' => $existingResearcher->last_name, 'email' => $existingResearcher->email],
        ],
        'keywords' => $research->keywords()->pluck('keyword_name')->all(),
        'clear_research_approval_sheet' => true,
        'research_approval_sheet' => $replacement,
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->research_manuscript)->toBe($manuscriptPath);
    expect($research->research_approval_sheet)->not->toBe($approvalPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($manuscriptPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($approvalPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($research->research_approval_sheet);
});

test('changing only the title keeps both file paths untouched', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    ['research' => $research, 'approval_path' => $approvalPath, 'manuscript_path' => $manuscriptPath] = seedResearchWithStoredFiles();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $existingResearcher = $research->researchers()->firstOrFail();

    $response = $this->actingAs($staff)->from('/staff/research')->post("/research/{$research->id}", [
        '_method' => 'put',
        'research_title' => 'Title Only Changed',
        'program_id' => $research->program_id,
        'research_adviser' => $research->research_adviser,
        'published_year' => $research->published_year,
        'research_abstract' => $research->research_abstract,
        'researchers' => [
            ['id' => $existingResearcher->id, 'first_name' => $existingResearcher->first_name, 'last_name' => $existingResearcher->last_name, 'email' => $existingResearcher->email],
        ],
        'keywords' => $research->keywords()->pluck('keyword_name')->all(),
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->research_approval_sheet)->toBe($approvalPath);
    expect($research->research_manuscript)->toBe($manuscriptPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($approvalPath);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($manuscriptPath);
});

test('edit data hides the existing file link once a removed file has been saved away', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    ['research' => $research, 'approval_path' => $approvalPath] = seedResearchWithStoredFiles();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);
    $existingResearcher = $research->researchers()->firstOrFail();

    $this->actingAs($staff)->from('/staff/research')->post("/research/{$research->id}", [
        '_method' => 'put',
        'research_title' => $research->research_title,
        'program_id' => $research->program_id,
        'research_adviser' => $research->research_adviser,
        'published_year' => $research->published_year,
        'research_abstract' => $research->research_abstract,
        'researchers' => [
            ['id' => $existingResearcher->id, 'first_name' => $existingResearcher->first_name, 'last_name' => $existingResearcher->last_name, 'email' => $existingResearcher->email],
        ],
        'keywords' => $research->keywords()->pluck('keyword_name')->all(),
        'clear_research_approval_sheet' => true,
    ])->assertSessionHasNoErrors();

    $json = $this->actingAs($staff)->getJson("/research/{$research->id}/edit-data")
        ->assertOk()
        ->json('data');

    expect($json['research_approval_sheet'])->toBeNull();
    expect($json['research_manuscript'])->not->toBeNull();
    \Illuminate\Support\Facades\Storage::disk('public')->assertMissing($approvalPath);
});

test('mciis staff with faculty role can change the adviser and persist it', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $staffFacultyRecord = makeFaculty('STAFFFAC-' . uniqid());
    $staff = User::factory()->create([
        'profile_completed' => true,
        'faculty_id' => $staffFacultyRecord->faculty_id,
    ]);

    $roleStaff = Role::firstOrCreate(['name' => 'MCIIS Staff'], ['description' => 'MCIIS Staff']);
    $roleFaculty = Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    $staff->roles()->sync([$roleStaff->id, $roleFaculty->id]);

    $newAdviser = makeFaculty('NEWADV-' . uniqid());

    $response = $this->actingAs($staff)->from('/staff/research')->put("/research/{$research->id}", [
        'research_title' => 'Updated Research Title',
        'program_id' => $research->program_id,
        'research_adviser' => $newAdviser->id,
        'completed_month' => 6,
        'completed_year' => 2024,
        'research_abstract' => 'Updated abstract text.',
        'researchers' => [
            ['first_name' => 'John', 'last_name' => 'Smith', 'email' => 'js@usep.edu.ph'],
        ],
        'keywords' => ['NewKeyword', 'AnotherKeyword'],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->research_adviser)->toBe($newAdviser->id);
});

test('update requires the core fields', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->put("/research/{$research->id}", [])
        ->assertSessionHasErrors(['research_title', 'program_id', 'completed_year', 'research_abstract', 'researchers', 'keywords']);
});

test('staff can upload a new research with all attributes and files', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $program = Program::factory()->create(['name' => 'BS Computer Science', 'code' => 'BSCS']);
    $adviser = makeFaculty('UPLOAD-ADV-' . uniqid());
    $panelist = makeFaculty('UPLOAD-PANEL-' . uniqid());
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $response = $this->actingAs($staff)->from('/staff/research')->post('/research', [
        'research_title' => 'Brand New Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'completed_month' => 3,
        'completed_year' => 2025,
        'research_abstract' => 'A brand new abstract.',
        'researchers' => [
            ['first_name' => 'Alice', 'last_name' => 'Wonder', 'email' => 'alice@usep.edu.ph'],
        ],
        'keywords' => ['FreshKeyword', 'AnotherFreshKeyword'],
        'panelists' => [$panelist->id],
        'research_approval_sheet' => \Illuminate\Http\UploadedFile::fake()->create('approval.pdf', 100, 'application/pdf'),
        'research_manuscript' => \Illuminate\Http\UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf'),
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research = Research::where('research_title', 'Brand New Research')->firstOrFail();
    expect($research->program_id)->toBe($program->id);
    expect($research->research_adviser)->toBe($adviser->id);
    expect($research->uploaded_by)->toBe($staff->id);
    expect($research->research_approval_sheet)->not->toBeNull();
    expect($research->research_manuscript)->not->toBeNull();
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($research->research_approval_sheet);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($research->research_manuscript);

    expect($research->researchers()->count())->toBe(1);
    expect($research->keywords()->pluck('keyword_name')->sort()->values()->all())
        ->toBe(['AnotherFreshKeyword', 'FreshKeyword']);
    expect($research->panelists()->pluck('faculties.id')->all())->toBe([$panelist->id]);
});

test('staff upload reports a duplicate researcher email on the matching email field', function () {
    ['research' => $existingResearch] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->from('/staff/research')->post('/research', [
        'research_title' => 'Duplicate Researcher Email Upload',
        'program_id' => $existingResearch->program_id,
        'completed_year' => now()->year,
        'research_abstract' => 'Testing the duplicate researcher email validation message.',
        'researchers' => [[
            'first_name' => 'Duplicate',
            'last_name' => 'Researcher',
            'email' => 'jd@usep.edu.ph',
        ]],
        'keywords' => ['DuplicateEmailValidation'],
    ])->assertSessionHasErrors([
        'researchers.0.email' => 'This email is already used by another researcher.',
    ]);
});

test('mciis staff with faculty role uploads research and honors selected adviser', function () {
    $program = Program::factory()->create(['name' => 'BS Computer Science', 'code' => 'BSCS']);
    $selectedAdviser = makeFaculty('UPLOAD-ADV-' . uniqid());
    $staffFacultyRecord = makeFaculty('STAFFFAC-' . uniqid());

    $staff = User::factory()->create([
        'profile_completed' => true,
        'faculty_id' => $staffFacultyRecord->faculty_id,
    ]);

    $roleStaff = Role::firstOrCreate(['name' => 'MCIIS Staff'], ['description' => 'MCIIS Staff']);
    $roleFaculty = Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
    $staff->roles()->sync([$roleStaff->id, $roleFaculty->id]);

    $response = $this->actingAs($staff)->from('/staff/research')->post('/research', [
        'research_title' => 'Dual Role Research',
        'program_id' => $program->id,
        'research_adviser' => $selectedAdviser->id,
        'completed_year' => 2025,
        'research_abstract' => 'Testing dual-role upload behavior.',
        'researchers' => [
            ['first_name' => 'Dual', 'last_name' => 'Role', 'email' => 'dual@usep.edu.ph'],
        ],
        'keywords' => ['DualRoleKeyword'],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research = Research::where('research_title', 'Dual Role Research')->firstOrFail();
    expect($research->research_adviser)->toBe($selectedAdviser->id);
    expect($research->uploaded_by)->toBe($staff->id);
});

test('upload requires the core fields', function () {
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $this->actingAs($staff)->post('/research', [])
        ->assertSessionHasErrors(['research_title', 'program_id', 'completed_year', 'research_abstract', 'researchers', 'keywords']);
});

test('staff can update research via method-spoofed post with a new file, keeping the other file intact', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    ['research' => $research] = seedManageResearchFixtures();
    $existingManuscript = \Illuminate\Http\UploadedFile::fake()->create('existing-manuscript.pdf', 100, 'application/pdf')
        ->store('research/manuscripts', 'public');
    $research->update(['research_manuscript' => $existingManuscript]);
    $existingResearcher = $research->researchers()->where('email', 'jd@usep.edu.ph')->firstOrFail();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    // Mirrors the edit modal: a POST carrying `_method=put`, since PHP never
    // parses multipart bodies on a genuine PUT request.
    $response = $this->actingAs($staff)->from('/staff/research')->post("/research/{$research->id}", [
        '_method' => 'put',
        'research_title' => 'Only Title Changed',
        'program_id' => $research->program_id,
        'research_adviser' => $research->research_adviser,
        'completed_year' => $research->completed_year,
        'research_abstract' => $research->research_abstract,
        'researchers' => [
            ['id' => $existingResearcher->id, 'first_name' => 'Jane', 'last_name' => 'Doe', 'email' => 'jd@usep.edu.ph'],
        ],
        'keywords' => ['ExistingKeyword'],
        'research_approval_sheet' => \Illuminate\Http\UploadedFile::fake()->create('new-approval.pdf', 100, 'application/pdf'),
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect('/staff/research');

    $research->refresh();
    expect($research->research_title)->toBe('Only Title Changed');
    expect($research->research_manuscript)->toBe($existingManuscript);
    expect($research->research_approval_sheet)->not->toBeNull();
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($research->research_approval_sheet);
    \Illuminate\Support\Facades\Storage::disk('public')->assertExists($research->research_manuscript);
});

test('update rejects a non-pdf approval sheet with a friendly message', function () {
    ['research' => $research] = seedManageResearchFixtures();
    $staff = User::factory()->asMCIISStaff()->create(['profile_completed' => true]);

    $response = $this->actingAs($staff)->put("/research/{$research->id}", [
        'research_title' => $research->research_title,
        'program_id' => $research->program_id,
        'research_adviser' => $research->research_adviser,
        'completed_year' => $research->completed_year,
        'research_abstract' => $research->research_abstract,
        'researchers' => [
            ['first_name' => 'Jane', 'last_name' => 'Doe', 'email' => 'jd@usep.edu.ph'],
        ],
        'keywords' => ['ExistingKeyword'],
        'research_approval_sheet' => \Illuminate\Http\UploadedFile::fake()->image('approval.jpg'),
    ]);

    $response->assertSessionHasErrors(['research_approval_sheet']);
    expect(session('errors')->get('research_approval_sheet')[0])
        ->toBe('Only PDF files are allowed for the approval sheet.');
});
