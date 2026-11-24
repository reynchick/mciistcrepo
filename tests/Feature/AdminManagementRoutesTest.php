<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('allows an administrator with multiple roles to open student and alignment management', function () {
    $user = User::factory()->create();
    $roleIds = collect(['Administrator', 'MCIIS Staff', 'Faculty', 'Librarian'])
        ->map(fn (string $name) => Role::firstOrCreate(['name' => $name])->id);
    $user->roles()->sync($roleIds);

    $this->actingAs($user)
        ->withSession(['active_role' => 'Administrator'])
        ->get(route('admin.students.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/students/index'));

    $this->actingAs($user)
        ->withSession(['active_role' => 'Administrator'])
        ->get(route('admin.research-alignments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/research-alignments/index'));
});

it('denies management pages when the user is not acting as an administrator', function () {
    $user = User::factory()->create();
    $user->roles()->sync([Role::firstOrCreate(['name' => 'MCIIS Staff'])->id]);

    $this->actingAs($user)
        ->withSession(['active_role' => 'MCIIS Staff'])
        ->get(route('admin.students.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->withSession(['active_role' => 'MCIIS Staff'])
        ->get(route('admin.research-alignments.index'))
        ->assertForbidden();
});
