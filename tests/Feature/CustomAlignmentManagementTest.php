<?php

use App\Models\Agenda;
use App\Models\CustomAlignmentCategory;
use App\Models\CustomAlignmentEntry;
use App\Models\Program;
use App\Models\Research;
use App\Models\Role;
use App\Models\SDG;
use App\Models\SRIG;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function customAlignmentUser(string $role): User
{
    // Fully onboarded so the global profile-completion gate doesn't redirect first.
    $user = User::factory()->create([
        'faculty_profile_completed' => true,
        'student_access_approved' => true,
        'student_access_approved_at' => now(),
    ]);
    $user->roles()->sync([Role::firstOrCreate(['name' => $role])->id]);

    return $user;
}

const CUSTOM_BASE = '/admin/research-alignments/custom-categories';

it('creates a custom category and exposes it to the alignment page', function () {
    $admin = customAlignmentUser('Administrator');

    $this->actingAs($admin)->post(CUSTOM_BASE, [
        'name' => 'National Development Priority',
        'label' => 'NDP',
        'description' => 'PDP goals',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->actingAs($admin)->get(route('admin.research-alignments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('sdgs')->has('srigs')->has('agendas')
            ->has('customCategories', 1)
            ->where('customCategories.0.name', 'National Development Priority')
            ->where('customCategories.0.label', 'NDP')
            ->where('customCategories.0.entries', []));
});

it('rejects empty, duplicate, and built-in category names', function (string $name, string $expected) {
    $admin = customAlignmentUser('Administrator');
    CustomAlignmentCategory::create(['name' => 'National Development Priority']);

    $this->actingAs($admin)->post(CUSTOM_BASE, ['name' => $name])
        ->assertSessionHasErrors(['name' => $expected]);
})->with([
    'empty' => ['   ', 'Category name is required.'],
    'duplicate (case-insensitive)' => ['national development priority', 'A category with this name already exists.'],
    'SDG' => ['sdg', '"sdg" is a built-in category. Choose a different name; SDG, SRIG, and Agenda already exist.'],
    'Agenda' => ['AGENDA', '"AGENDA" is a built-in category. Choose a different name; SDG, SRIG, and Agenda already exist.'],
    'too long' => [str_repeat('a', 101), 'Category name may not be longer than 100 characters.'],
]);

it('allows renaming a category to its own name with different casing', function () {
    $admin = customAlignmentUser('Administrator');
    $category = CustomAlignmentCategory::create(['name' => 'National Development Priority']);

    $this->actingAs($admin)->put(CUSTOM_BASE."/{$category->id}", ['name' => 'National development priority', 'label' => ''])
        ->assertSessionHasNoErrors();

    expect($category->fresh()->name)->toBe('National development priority')
        ->and($category->fresh()->label)->toBeNull();
});

it('adds, edits, and deletes entries with zero usage', function () {
    $admin = customAlignmentUser('Administrator');
    $category = CustomAlignmentCategory::create(['name' => 'National Development Priority']);

    $this->actingAs($admin)->post(CUSTOM_BASE."/{$category->id}/entries", ['name' => 'NDP1', 'description' => 'Inclusive growth'])
        ->assertSessionHasNoErrors();
    $entry = $category->entries()->firstOrFail();

    $this->actingAs($admin)->post(CUSTOM_BASE."/{$category->id}/entries", ['name' => 'ndp1', 'description' => 'Dup'])
        ->assertSessionHasErrors(['name' => 'An entry with this name / code already exists in this category.']);

    $this->actingAs($admin)->put(CUSTOM_BASE."/{$category->id}/entries/{$entry->id}", ['name' => 'NDP1', 'description' => 'Inclusive economic growth'])
        ->assertSessionHasNoErrors();
    expect($entry->fresh()->description)->toBe('Inclusive economic growth');

    $this->actingAs($admin)->get(route('admin.research-alignments.index'))
        ->assertInertia(fn (Assert $page) => $page->where('customCategories.0.entries.0.researches_count', 0));

    $this->actingAs($admin)->delete(CUSTOM_BASE."/{$category->id}/entries/{$entry->id}")->assertSessionHasNoErrors();
    expect(CustomAlignmentEntry::count())->toBe(0);
});

it('scopes entries to their category', function () {
    $admin = customAlignmentUser('Administrator');
    $a = CustomAlignmentCategory::create(['name' => 'Category A']);
    $b = CustomAlignmentCategory::create(['name' => 'Category B']);
    $entry = $a->entries()->create(['name' => 'A1', 'description' => 'A one']);

    $this->actingAs($admin)->delete(CUSTOM_BASE."/{$b->id}/entries/{$entry->id}")->assertNotFound();
    expect($entry->fresh())->not->toBeNull();
});

it('blocks deleting a category with entries or linked research, and deletes an empty one', function () {
    $admin = customAlignmentUser('Administrator');
    $category = CustomAlignmentCategory::create(['name' => 'National Development Priority']);
    $entry = $category->entries()->create(['name' => 'NDP1', 'description' => 'Inclusive growth']);

    $this->actingAs($admin)->delete(CUSTOM_BASE."/{$category->id}")
        ->assertSessionHasErrors(['delete' => 'The "National Development Priority" category cannot be deleted because it still has 1 entry. Delete its entries first.']);

    $research = Research::factory()->create(['program_id' => Program::factory()->create()->id]);
    $entry->researches()->attach($research->id);

    $this->actingAs($admin)->delete(CUSTOM_BASE."/{$category->id}/entries/{$entry->id}")
        ->assertSessionHasErrors('delete');
    $this->actingAs($admin)->delete(CUSTOM_BASE."/{$category->id}")
        ->assertSessionHasErrors(['delete' => 'The "National Development Priority" category cannot be deleted because 1 research record(s) are linked to it.']);

    $entry->researches()->detach();
    $entry->delete();

    $this->actingAs($admin)->delete(CUSTOM_BASE."/{$category->id}")->assertSessionHasNoErrors();
    expect(CustomAlignmentCategory::count())->toBe(0);
});

it('forbids non-admin users from every custom alignment route', function (string $role) {
    $user = customAlignmentUser($role);
    $category = CustomAlignmentCategory::create(['name' => 'National Development Priority']);
    $entry = $category->entries()->create(['name' => 'NDP1', 'description' => 'Inclusive growth']);

    $this->actingAs($user)->post(CUSTOM_BASE, ['name' => 'X'])->assertForbidden();
    $this->actingAs($user)->put(CUSTOM_BASE."/{$category->id}", ['name' => 'X'])->assertForbidden();
    $this->actingAs($user)->delete(CUSTOM_BASE."/{$category->id}")->assertForbidden();
    $this->actingAs($user)->post(CUSTOM_BASE."/{$category->id}/entries", ['name' => 'X', 'description' => 'X'])->assertForbidden();
    $this->actingAs($user)->put(CUSTOM_BASE."/{$category->id}/entries/{$entry->id}", ['name' => 'X', 'description' => 'X'])->assertForbidden();
    $this->actingAs($user)->delete(CUSTOM_BASE."/{$category->id}/entries/{$entry->id}")->assertForbidden();

    expect(CustomAlignmentCategory::count())->toBe(1)->and(CustomAlignmentEntry::count())->toBe(1);
})->with(['MCIIS Staff', 'Faculty', 'Student']);

it('leaves the built-in SDG, SRIG, and Agenda data untouched', function () {
    $admin = customAlignmentUser('Administrator');
    SDG::create(['name' => 'SDG1: No Poverty']);
    SRIG::create(['name' => 'SRIG1: AI']);
    Agenda::create(['name' => 'AGENDA1: Digital Transformation']);

    $this->actingAs($admin)->post(CUSTOM_BASE, ['name' => 'National Development Priority']);

    expect(SDG::count())->toBe(1)->and(SRIG::count())->toBe(1)->and(Agenda::count())->toBe(1);
});
