<?php

use App\Models\Program;
use App\Models\Research;
use App\Models\ResearchAlignmentCategory;
use App\Models\ResearchAlignmentEntry;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows administrators to manage configurable research alignment categories and entries', function () {
    $admin = User::factory()->create();
    $admin->roles()->sync([Role::firstOrCreate(['name' => 'Administrator'])->id]);

    $this->actingAs($admin)
        ->get(route('admin.research-alignments.index'))
        ->assertOk();

    $response = $this->actingAs($admin)->post(route('admin.research-alignments.categories.store'), [
        'name' => 'Institutional Priority',
        'description' => 'Top institutional goals',
    ]);

    $response->assertRedirect();

    $category = ResearchAlignmentCategory::query()->where('name', 'Institutional Priority')->firstOrFail();

    $this->actingAs($admin)->post(route('admin.research-alignments.entries.store', $category), [
        'name' => 'Institutional Priority 1',
        'code' => 'IP-1',
        'description' => 'Student success',
    ])->assertRedirect();

    $entry = ResearchAlignmentEntry::query()->where('name', 'Institutional Priority 1')->firstOrFail();
    expect($category->entries()->count())->toBe(1)
        ->and($entry->category->id)->toBe($category->id);

    $program = Program::factory()->create();
    $research = Research::factory()->create([
        'program_id' => $program->id,
        'research_title' => 'Generic Alignment Research',
    ]);

    $this->actingAs($admin)->put(route('research.update', $research), [
        'research_title' => 'Generic Alignment Research',
        'program_id' => $program->id,
        'completed_year' => now()->year,
        'research_abstract' => 'Updated abstract',
        'alignment_entries' => [
            $category->id => [$entry->id],
        ],
    ])->assertRedirect();

    $research->refresh();
    expect($research->alignmentEntries()->where('research_alignment_entry_id', $entry->id)->exists())->toBeTrue();
});
