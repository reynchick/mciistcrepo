<?php

use App\Models\Faculty;
use App\Models\Program;
use App\Models\Research;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function uploadResearchWithFiles(User $staff): Research
{
    $program = Program::factory()->create(['name' => 'BS Computer Science', 'code' => 'BSCS']);
    $adviser = Faculty::create(['faculty_id' => 'DL-ADV-' . uniqid(), 'first_name' => 'Test', 'last_name' => 'Adviser']);

    $response = test()->actingAs($staff)->post('/research', [
        'research_title' => 'Download Flow Research',
        'program_id' => $program->id,
        'research_adviser' => $adviser->id,
        'completed_year' => 2025,
        'research_abstract' => 'Abstract for download test.',
        'researchers' => [
            ['first_name' => 'Alice', 'last_name' => 'Wonder', 'email' => 'alice.dl@usep.edu.ph'],
        ],
        'keywords' => ['DownloadKeyword'],
        'research_manuscript' => \Illuminate\Http\UploadedFile::fake()->create('manuscript.pdf', 100, 'application/pdf'),
    ]);

    $response->assertSessionHasNoErrors();

    $research = Research::where('research_title', 'Download Flow Research')->firstOrFail();
    $research->forceFill(['status' => 'posted', 'posted_at' => now()])->save();

    return $research;
}

function userWithRoles(string ...$roles): User
{
    $user = User::factory()->create();
    $roleIds = collect($roles)->map(fn (string $name): int => Role::firstOrCreate(
        ['name' => $name],
        ['description' => $name],
    )->id);
    $user->roles()->sync($roleIds);

    return $user;
}

beforeEach(function () {
    Storage::fake('private');
});

test('active privileged roles can download a manuscript with a sensible filename', function () {
    $staff = userWithRoles('MCIIS Staff');
    $research = uploadResearchWithFiles($staff);

    foreach (['Administrator', 'MCIIS Staff', 'Faculty', 'Librarian'] as $role) {
        $user = userWithRoles($role);
        if ($role === 'Faculty') {
            $user->forceFill(['faculty_profile_completed' => true])->save();
        }
        $response = $this->actingAs($user)
            ->withSession(['active_role' => $role])
            ->get("/research/{$research->id}/manuscript");

        $this->assertSame(
            200,
            $response->getStatusCode(),
            "Role {$role} received a redirect to ".$response->headers->get('Location'),
        );
        expect($response->headers->get('content-disposition'))
            ->toContain('Download_Flow_Research_Manuscript.pdf');
    }
});

test('students cannot download a manuscript', function () {
    $staff = userWithRoles('MCIIS Staff');
    $research = uploadResearchWithFiles($staff);
    $student = userWithRoles('Student');
    $student->forceFill([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ])->save();
    $this->actingAs($student)
        ->withSession(['active_role' => 'Student'])
        ->get("/research/{$research->id}/manuscript")
        ->assertForbidden();
});

test('guests cannot download manuscripts', function () {
    $staff = userWithRoles('MCIIS Staff');
    $research = uploadResearchWithFiles($staff);
    Auth::logout();

    $this->get("/research/{$research->id}/manuscript")->assertRedirect();
});

test('an unassigned active role cannot grant manuscript downloads', function () {
    $staff = userWithRoles('MCIIS Staff');
    $research = uploadResearchWithFiles($staff);
    $student = userWithRoles('Student');
    $student->forceFill([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ])->save();

    $this->actingAs($student)
        ->withSession(['active_role' => 'Administrator'])
        ->get("/research/{$research->id}/manuscript")
        ->assertForbidden();
});

test('a multi-role user can download only while acting as an allowed role', function () {
    $staff = userWithRoles('MCIIS Staff');
    $research = uploadResearchWithFiles($staff);
    $user = userWithRoles('Student', 'Faculty');
    $user->forceFill([
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
        'faculty_profile_completed' => true,
    ])->save();

    $this->actingAs($user)
        ->withSession(['active_role' => 'Student'])
        ->get("/research/{$research->id}/manuscript")
        ->assertForbidden();

    $this->actingAs($user)
        ->withSession(['active_role' => 'Faculty'])
        ->get("/research/{$research->id}/manuscript")
        ->assertOk();
});

test('file access request endpoints are no longer available', function () {
    $student = userWithRoles('Student');
    $research = Research::factory()->posted()->create([
        'program_id' => Program::factory()->create()->id,
    ]);

    $this->actingAs($student)->post("/guest/research/{$research->id}/request")->assertNotFound();
    $this->actingAs($student)->get('/student/access-requests')->assertNotFound();
});

test('file access request tables are removed from the active schema', function () {
    foreach ([
        'guest_file_request_access_grants',
        'guest_file_request_tokens',
        'guest_file_request_events',
        'guest_file_requests',
    ] as $table) {
        expect(Schema::hasTable($table))->toBeFalse();
    }
});

test('an allowed role receives unavailable when the manuscript is missing', function () {
    $research = Research::factory()->create([
        'program_id' => Program::factory()->create()->id,
        'research_manuscript' => null,
    ]);
    $staff = userWithRoles('MCIIS Staff');

    $this->actingAs($staff)
        ->withSession(['active_role' => 'MCIIS Staff'])
        ->get("/research/{$research->id}/manuscript")
        ->assertStatus(410);
});
