<?php

use App\Enums\ResearchStatus;
use App\Http\Actions\Research\ArchiveResearchAction;
use App\Http\Actions\Research\PublishResearchAction;
use App\Http\Actions\Research\SubmitForReviewAction;
use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('research workflow actions', function () {
    it('submits research for review and records a workflow log', function () {
        $user = User::factory()->create();
        $research = Research::factory()->create(['status' => ResearchStatus::DRAFT, 'entry_mode' => 'faculty_student']);

        $action = new SubmitForReviewAction();
        $result = $action->execute($research, $user, 'Ready for review');

        expect($result)->toBeTrue()
            ->and($research->refresh()->status)->toEqual(ResearchStatus::SUBMITTED)
            ->and($research->researchEntryLogsTargeting()->latest()->first()->action_type)->toBe(ResearchEntryLog::ACTION_SUBMIT_FOR_REVIEW)
            ->and($research->researchEntryLogsTargeting()->latest()->first()->metadata['note'])->toBe('Ready for review');
    });

    it('publishes research when required fields are present and records the log', function () {
        $user = User::factory()->create();
        $program = \App\Models\Program::factory()->create();
        $faculty = \App\Models\Faculty::create([
            'faculty_id' => 'F001',
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
        ]);
        $research = Research::factory()->create([
            'status' => ResearchStatus::SUBMITTED,
            'research_title' => 'Published research',
            'research_abstract' => 'A valid abstract',
            'program_id' => $program->id,
            'research_adviser' => $faculty->id,
            'research_manuscript' => 'manuscript.pdf',
            'published_year' => 2026,
        ]);

        $action = new PublishResearchAction();
        $result = $action->execute($research, $user, 'Published by staff');

        expect($result)->toBeTrue()
            ->and($research->refresh()->status)->toEqual(ResearchStatus::PUBLISHED)
            ->and($research->refresh()->published_at)->not->toBeNull()
            ->and($research->researchEntryLogsTargeting()->latest()->first()->action_type)->toBe(ResearchEntryLog::ACTION_PUBLISH);
    });

    it('archives a research item with a required reason', function () {
        $user = User::factory()->create();
        $research = Research::factory()->create(['status' => ResearchStatus::PUBLISHED]);

        $action = new ArchiveResearchAction();
        $result = $action->execute($research, 'No longer active', $user);

        expect($result)->toBeTrue()
            ->and($research->refresh()->status)->toEqual(ResearchStatus::ARCHIVED)
            ->and($research->refresh()->archived_at)->not->toBeNull()
            ->and($research->researchEntryLogsTargeting()->latest()->first()->action_type)->toBe(ResearchEntryLog::ACTION_ARCHIVE);
    });
});
