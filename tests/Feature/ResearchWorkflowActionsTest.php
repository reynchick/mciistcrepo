<?php

use App\Enums\ResearchStatus;
use App\Http\Actions\Research\ArchiveResearchAction;
use App\Http\Actions\Research\PostResearchAction;
use App\Models\Agenda;
use App\Models\Faculty;
use App\Models\Keyword;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\Sdg;
use App\Models\Srig;
use App\Models\User;
use App\Services\PostingReadinessService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeResearchReadyForWorkflow(Research $research, Faculty $adviser): void
{
    $research->forceFill([
        'research_adviser' => $adviser->id,
        'completed_month' => 6,
        'completed_year' => 2026,
        'research_abstract' => 'A valid abstract for workflow tests.',
        'research_manuscript' => 'manuscript.pdf',
    ])->save();
    $research->researchers()->delete();
    $research->researchers()->create([
        'first_name' => 'Research',
        'last_name' => 'Author',
        'email' => 'author@usep.edu.ph',
    ]);
    $research->panelists()->sync([$adviser->id]);
    $research->keywords()->sync([Keyword::create(['keyword_name' => 'Workflow ' . uniqid()])->id]);
    $research->agendas()->sync([Agenda::create(['name' => 'Workflow ' . uniqid()])->id]);
    $research->sdgs()->sync([Sdg::create(['name' => 'Workflow ' . uniqid()])->id]);
    $research->srigs()->sync([Srig::create(['name' => 'Workflow ' . uniqid()])->id]);
}

describe('research workflow actions', function () {
    it('posts research when required fields are present and records the log', function () {
        $user = User::factory()->create();
        $program = \App\Models\Program::factory()->create();
        $faculty = \App\Models\Faculty::create([
            'faculty_id' => 'F001',
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
        ]);
        $research = Research::factory()->create([
            'status' => ResearchStatus::SUBMITTED,
            'research_title' => 'Posted research',
            'program_id' => $program->id,
        ]);
        makeResearchReadyForWorkflow($research, $faculty);

        $action = new PostResearchAction(app(PostingReadinessService::class));
        $result = $action->execute($research, $user, 'Posted by staff');

        expect($result)->toBeTrue()
            ->and($research->refresh()->status)->toEqual(ResearchStatus::POSTED)
            ->and($research->refresh()->posted_at)->not->toBeNull()
            ->and($research->researchEntryLogsTargeting()->latest()->first()->action_type)->toBe(ResearchEntryLog::ACTION_POST);
    });

    it('archives a research item with a required reason', function () {
        $user = User::factory()->create();
        $research = Research::factory()->create(['status' => ResearchStatus::POSTED]);

        $action = new ArchiveResearchAction();
        $result = $action->execute($research, 'No longer active', $user);

        expect($result)->toBeTrue()
            ->and($research->refresh()->status)->toEqual(ResearchStatus::ARCHIVED)
            ->and($research->refresh()->archived_at)->not->toBeNull()
            ->and($research->researchEntryLogsTargeting()->latest()->first()->action_type)->toBe(ResearchEntryLog::ACTION_ARCHIVE);
    });
});
