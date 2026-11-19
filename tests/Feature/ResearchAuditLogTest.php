<?php

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\Role;
use App\Models\User;
use App\Services\ResearchSaveDecisionService;
use App\Services\ResearchAuditSnapshotService;
use App\Support\BrowserData;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('research edits log only changed fields with display-safe relationship snapshots', function () {
    $staff = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->create([
        'research_title' => 'Original research title',
    ]);
    $research->keywords()->create(['keyword_name' => 'Original keyword']);

    app(ResearchSaveDecisionService::class)->commit(
        $research,
        [
            'research_title' => 'Updated research title',
            'keywords' => ['Updated keyword'],
        ],
        null,
        $staff,
    );

    $logs = ResearchEntryLog::query()
        ->where('target_research_id', $research->id)
        ->where('action_type', ResearchEntryLog::ACTION_UPDATE)
        ->get();

    app(ResearchSaveDecisionService::class)->commit(
        $research->fresh(),
        [
            'research_title' => 'Updated research title',
            'keywords' => ['Updated keyword'],
        ],
        null,
        $staff,
    );

    expect($logs)->toHaveCount(1)
        ->and($logs[0]->old_values['research_title'])->toBe('Original research title')
        ->and($logs[0]->new_values['research_title'])->toBe('Updated research title')
        ->and($logs[0]->old_values['keywords'])->toBe(['Original keyword'])
        ->and($logs[0]->new_values['keywords'])->toBe(['Updated keyword'])
        ->and($logs[0]->metadata['changed'])->toContain('research_title', 'keywords')
        ->and(ResearchEntryLog::query()->where('target_research_id', $research->id)->where('action_type', ResearchEntryLog::ACTION_UPDATE)->count())->toBe(1);
});

test('librarian metadata edits appear in the research activity and admin log payload', function () {
    $librarian = User::factory()->create();
    $librarianRole = Role::firstOrCreate(['name' => 'Librarian'], ['description' => 'Librarian']);
    $librarian->roles()->sync([$librarianRole->id]);
    $research = Research::factory()->create([
        'research_title' => 'Metadata audit research',
        'physical_attributes' => [
            'hardboundLocation' => 'Shelf A',
            'physicalAvailability' => false,
        ],
    ]);
    $research->metadataValues()->createMany([
        ['term' => 'title', 'value' => 'Old metadata title', 'sort_order' => 0],
        ['term' => 'subject', 'value' => 'Old subject', 'sort_order' => 0],
    ]);

    $this->actingAs($librarian)
        ->withSession(['active_role' => 'Librarian'])
        ->put("/librarian/research/{$research->id}/metadata", [
            'metadata' => [
                ['term' => 'title', 'value' => 'New metadata title', 'sort_order' => 0],
                ['term' => 'publisher', 'value' => 'New publisher', 'sort_order' => 0],
            ],
            'physical_attributes' => [
                'hardboundLocation' => 'Shelf B',
                'physicalAvailability' => true,
            ],
            'manuscript_unavailable' => false,
        ])
        ->assertRedirect(route('librarian.research.index'));

    $log = ResearchEntryLog::query()
        ->where('target_research_id', $research->id)
        ->where('action_type', ResearchEntryLog::ACTION_UPDATE)
        ->sole();
    $payload = BrowserData::log($log, true);

    expect($log->old_values['metadata_values'])->toBe([
        ['term' => 'subject', 'value' => 'Old subject', 'scheme' => null],
        ['term' => 'title', 'value' => 'Old metadata title', 'scheme' => null],
    ])
        ->and($log->new_values['metadata_values'])->toBe([
            ['term' => 'publisher', 'value' => 'New publisher', 'scheme' => null],
        ])
        ->and($log->metadata['changed'])->toContain('metadata_values', 'physical_attributes')
        ->and($payload['old_values']['metadata_values'])->toBe($log->old_values['metadata_values'])
        ->and($payload['new_values']['metadata_values'])->toBe($log->new_values['metadata_values'])
        ->and($payload['metadata']['target_snapshot']['title'])->toBe('Metadata audit research');

    $staff = User::factory()->asMCIISStaff()->create();
    $this->actingAs($staff)
        ->getJson("/research/{$research->id}/status-history")
        ->assertOk()
        ->assertJsonPath('data.0.new_values.metadata_values.0.value', 'New publisher');

    $admin = User::factory()->asAdministrator()->create();
    $this->actingAs($admin)
        ->getJson("/logs/research-entry/{$log->id}/details")
        ->assertOk()
        ->assertJsonPath('data.new_values.metadata_values.0.value', 'New publisher')
        ->assertJsonPath('data.metadata.target_snapshot.title', 'Metadata audit research');
});

test('manuscript file changes are recorded without exposing storage paths', function () {
    $actor = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->create(['research_manuscript' => null]);
    $auditSnapshots = app(ResearchAuditSnapshotService::class);
    $oldSnapshot = $auditSnapshots->capture($research);

    $research->forceFill(['research_manuscript' => 'research/manuscripts/private-file.pdf'])->save();
    $log = $auditSnapshots->recordChanges(
        $research->fresh(),
        $oldSnapshot,
        $auditSnapshots->capture($research->fresh()),
        $actor,
        'research_edit',
    );

    expect($log->old_values['manuscript_file'])->toBe('No manuscript')
        ->and($log->new_values['manuscript_file'])->toBe('Uploaded manuscript')
        ->and(json_encode([$log->old_values, $log->new_values]))->not->toContain('private-file.pdf');
});
