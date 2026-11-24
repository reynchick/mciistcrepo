<?php

use App\Models\Research;
use App\Models\ResearchEntryLog;
use App\Models\Role;
use App\Models\User;
use App\Services\ResearchAuditSnapshotService;
use App\Services\ResearchSaveDecisionService;
use App\Support\BrowserData;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

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
        'hardbound_location' => 'Shelf A',
        'physical_availability' => false,
    ]);
    $research->metadataValues()->createMany([
        ['term' => 'subject', 'value' => 'Old subject', 'sort_order' => 0],
    ]);

    $this->actingAs($librarian)
        ->withSession(['active_role' => 'Librarian'])
        ->put("/librarian/research/{$research->id}/metadata", [
            'metadata' => [
                ['term' => 'publisher', 'value' => 'New publisher', 'sort_order' => 0],
            ],
            'hardbound_location' => 'Shelf B',
            'physical_availability' => true,
            'manuscript_unavailable' => true,
        ])
        ->assertRedirect(route('librarian.research.index'));

    expect($research->refresh()->manuscript_unavailable)->toBeTrue();
    expect($research->metadataValues()->pluck('term')->all())->toBe(['publisher']);

    $log = ResearchEntryLog::query()
        ->where('target_research_id', $research->id)
        ->where('action_type', ResearchEntryLog::ACTION_UPDATE)
        ->sole();
    $payload = BrowserData::log($log, true);

    expect($log->old_values['metadata_values'])->toBe([
        ['term' => 'subject', 'value' => 'Old subject', 'scheme' => null],
    ])
        ->and($log->new_values['metadata_values'])->toBe([
            ['term' => 'publisher', 'value' => 'New publisher', 'scheme' => null],
        ])
        ->and($log->old_values['hardbound_location'])->toBe('Shelf A')
        ->and($log->new_values['hardbound_location'])->toBe('Shelf B')
        ->and($log->old_values['physical_availability'])->toBeFalse()
        ->and($log->new_values['physical_availability'])->toBeTrue()
        ->and($log->metadata['changed'])->toContain('metadata_values', 'hardbound_location', 'physical_availability')
        ->and($payload['old_values']['metadata_values'])->toBe($log->old_values['metadata_values'])
        ->and($payload['new_values']['metadata_values'])->toBe($log->new_values['metadata_values'])
        ->and($payload['old_values']['hardbound_location'])->toBe('Shelf A')
        ->and($payload['new_values']['physical_availability'])->toBeTrue()
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

test('physical attribute audit logs include only the value that changed', function () {
    $actor = User::factory()->asMCIISStaff()->create();
    $research = Research::factory()->create([
        'hardbound_location' => 'Shelf A',
        'physical_availability' => false,
    ]);
    $auditSnapshots = app(ResearchAuditSnapshotService::class);
    $oldSnapshot = $auditSnapshots->capture($research);

    $research->forceFill([
        'hardbound_location' => 'Shelf B',
        'physical_availability' => false,
    ])->save();
    $locationLog = $auditSnapshots->recordChanges(
        $research->fresh(),
        $oldSnapshot,
        $auditSnapshots->capture($research->fresh()),
        $actor,
        'research_edit',
    );

    expect($locationLog->metadata['changed'])->toBe(['hardbound_location'])
        ->and($locationLog->old_values)->toBe(['hardbound_location' => 'Shelf A'])
        ->and($locationLog->new_values)->toBe(['hardbound_location' => 'Shelf B']);

    $oldSnapshot = $auditSnapshots->capture($research->fresh());
    $research->forceFill([
        'hardbound_location' => 'Shelf B',
        'physical_availability' => true,
    ])->save();
    $availabilityLog = $auditSnapshots->recordChanges(
        $research->fresh(),
        $oldSnapshot,
        $auditSnapshots->capture($research->fresh()),
        $actor,
        'research_edit',
    );

    expect($availabilityLog->metadata['changed'])->toBe(['physical_availability'])
        ->and($availabilityLog->old_values)->toBe(['physical_availability' => false])
        ->and($availabilityLog->new_values)->toBe(['physical_availability' => true]);
});

test('librarian metadata cannot store terms derived from the core research record', function () {
    $librarian = User::factory()->create();
    $librarianRole = Role::firstOrCreate(['name' => 'Librarian'], ['description' => 'Librarian']);
    $librarian->roles()->sync([$librarianRole->id]);
    $research = Research::factory()->create();

    $this->actingAs($librarian)
        ->withSession(['active_role' => 'Librarian'])
        ->from("/librarian/research/{$research->id}/metadata")
        ->put("/librarian/research/{$research->id}/metadata", [
            'metadata' => [
                ['term' => 'title', 'value' => 'Duplicate title'],
                ['term' => 'creator', 'value' => 'Duplicate creator'],
                ['term' => 'date', 'value' => '2025-01'],
            ],
            'hardbound_location' => '',
            'physical_availability' => false,
            'manuscript_unavailable' => false,
        ])
        ->assertSessionHasErrors([
            'metadata.0.term',
            'metadata.1.term',
            'metadata.2.term',
        ]);

    expect($research->metadataValues()->count())->toBe(0);
});

test('sqlite rejects derived Dublin Core terms even when inserted or updated outside the application', function () {
    $research = Research::factory()->create();

    expect(fn () => DB::table('research_metadata_values')->insert([
        'research_id' => $research->id,
        'term' => 'title',
        'value' => 'Duplicate title',
    ]))->toThrow(QueryException::class);

    $metadata = $research->metadataValues()->create([
        'term' => 'subject',
        'value' => 'Research repositories',
    ]);

    expect(fn () => DB::table('research_metadata_values')
        ->where('id', $metadata->id)
        ->update(['term' => 'creator']))->toThrow(QueryException::class);
});

test('librarian metadata accepts the full scheme field limit', function () {
    $librarian = User::factory()->create();
    $librarianRole = Role::firstOrCreate(['name' => 'Librarian'], ['description' => 'Librarian']);
    $librarian->roles()->sync([$librarianRole->id]);
    $research = Research::factory()->create();
    $scheme = str_repeat('s', 255);

    $this->actingAs($librarian)
        ->withSession(['active_role' => 'Librarian'])
        ->put("/librarian/research/{$research->id}/metadata", [
            'metadata' => [
                ['term' => 'publisher', 'value' => 'Example publisher', 'scheme' => $scheme],
            ],
            'hardbound_location' => '',
            'physical_availability' => false,
            'manuscript_unavailable' => false,
        ])
        ->assertSessionHasNoErrors();

    expect($research->metadataValues()->sole()->scheme)->toBe($scheme);
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
