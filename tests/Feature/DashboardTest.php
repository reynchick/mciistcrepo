<?php

use App\Models\User;
use App\Models\Keyword;
use App\Models\KeywordSearchLog;
use App\Models\Research;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->asAdministrator()->create();

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
});

test('admin dashboard resolves a status filter without crashing', function () {
    $user = User::factory()->asAdministrator()->create();

    $this->actingAs($user)
        ->get(route('dashboard', ['status_filter' => 'posted']))
        ->assertOk();
});

test('most explored topic counts distinct researches using each keyword', function () {
    $researches = Research::factory()->posted()->count(3)->create(['completed_year' => 2020]);

    $sharedKeyword = Keyword::query()->create(['keyword_name' => 'Renewable energy']);
    $frequentlySearchedKeyword = Keyword::query()->create(['keyword_name' => 'Machine learning']);

    $researches[0]->keywords()->attach($sharedKeyword);
    $researches[1]->keywords()->attach($sharedKeyword);
    $researches[2]->keywords()->attach($frequentlySearchedKeyword);

    foreach (range(1, 5) as $_) {
        KeywordSearchLog::query()->create([
            'keyword_id' => $frequentlySearchedKeyword->id,
            'search_term' => $frequentlySearchedKeyword->keyword_name,
        ]);
    }

    $this->actingAs(User::factory()->asAdministrator()->create())
        ->get(route('dashboard', ['year_start' => 2020, 'year_end' => 2020]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/admin/index')
            ->where('mostUsedResearchKeyword.keyword', 'Renewable energy')
            ->where('mostUsedResearchKeyword.researchCount', 2)
            ->where('mostUsedResearchKeyword.percentage', 66.7));
});