<?php

use App\Http\Requests\UpdateResearchRequest;
use App\Models\Research;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

function registerResearcherEmailValidationRoute(): void
{
    Route::put('/__tests/research/{research}/validation', function (UpdateResearchRequest $request, Research $research) {
        return response()->json(['valid' => true]);
    })->middleware('web');
}

function createResearcherEmailValidationFixture(string $email): array
{
    $research = Research::factory()->draft()->create();
    $researcher = $research->researchers()->create([
        'first_name' => 'Legacy',
        'last_name' => 'Researcher',
        'email' => $email,
    ]);

    return [$research, $researcher];
}

function updateResearcherEmailPayload(Research $research, array $researchers): array
{
    return [
        'research_title' => $research->research_title,
        'program_id' => $research->program_id,
        'researchers' => $researchers,
    ];
}

test('unchanged legacy researcher emails remain valid when updating research', function () {
    registerResearcherEmailValidationRoute();
    [$research, $researcher] = createResearcherEmailValidationFixture('legacy@example.com');
    $staff = User::factory()->asMCIISStaff()->create();

    $this->actingAs($staff)
        ->put("/__tests/research/{$research->id}/validation", updateResearcherEmailPayload($research, [[
            'id' => $researcher->id,
            'first_name' => $researcher->first_name,
            'last_name' => $researcher->last_name,
            'email' => $researcher->email,
        ]]))
        ->assertOk()
        ->assertJsonPath('valid', true);
});

test('changed researcher emails must use the USeP domain', function () {
    registerResearcherEmailValidationRoute();
    [$research, $researcher] = createResearcherEmailValidationFixture('legacy@example.com');
    $staff = User::factory()->asMCIISStaff()->create();

    $this->actingAs($staff)
        ->from('/research')
        ->put("/__tests/research/{$research->id}/validation", updateResearcherEmailPayload($research, [[
            'id' => $researcher->id,
            'first_name' => $researcher->first_name,
            'last_name' => $researcher->last_name,
            'email' => 'changed@example.com',
        ]]))
        ->assertSessionHasErrors([
            'researchers.0.email' => 'The researcher email must be a valid USeP email (name@usep.edu.ph).',
        ]);
});

test('researcher emails cannot duplicate another researcher when updating research', function () {
    registerResearcherEmailValidationRoute();
    [$research, $researcher] = createResearcherEmailValidationFixture('first@usep.edu.ph');
    $otherResearcher = $research->researchers()->create([
        'first_name' => 'Other',
        'last_name' => 'Researcher',
        'email' => 'other@usep.edu.ph',
    ]);
    $staff = User::factory()->asMCIISStaff()->create();

    $this->actingAs($staff)
        ->from('/research')
        ->put("/__tests/research/{$research->id}/validation", updateResearcherEmailPayload($research, [[
            'id' => $researcher->id,
            'first_name' => $researcher->first_name,
            'last_name' => $researcher->last_name,
            'email' => $otherResearcher->email,
        ]]))
        ->assertSessionHasErrors([
            'researchers.0.email' => 'This email is already used by another researcher.',
        ]);
});

test('research updates reject duplicate researcher emails within the submission', function () {
    registerResearcherEmailValidationRoute();
    [$research, $researcher] = createResearcherEmailValidationFixture('first@usep.edu.ph');
    $staff = User::factory()->asMCIISStaff()->create();

    $this->actingAs($staff)
        ->from('/research')
        ->put("/__tests/research/{$research->id}/validation", updateResearcherEmailPayload($research, [
            [
                'id' => $researcher->id,
                'first_name' => $researcher->first_name,
                'last_name' => $researcher->last_name,
                'email' => 'shared@usep.edu.ph',
            ],
            [
                'first_name' => 'New',
                'last_name' => 'Researcher',
                'email' => 'SHARED@USEP.EDU.PH',
            ],
        ]))
        ->assertSessionHasErrors([
            'researchers.1.email' => 'This email is already used by another researcher in this list.',
        ]);
});
