<?php

use App\Http\Actions\User\CheckEmailUniquenessAction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('email is unique when no user exists', function () {
    $action = new CheckEmailUniquenessAction();

    $response = $action->execute('unique@example.com');

    expect($response->status())->toBe(200);
    expect($response->getData(true)['unique'])->toBeTrue();
});

test('email is not unique when user exists', function () {
    User::factory()->create(['email' => 'taken@example.com']);
    $action = new CheckEmailUniquenessAction();

    $response = $action->execute('taken@example.com');

    expect($response->status())->toBe(200);
    expect($response->getData(true)['unique'])->toBeFalse();
});

test('email is considered unique when ignoring current user', function () {
    $user = User::factory()->create(['email' => 'kept@example.com']);
    $action = new CheckEmailUniquenessAction();

    $response = $action->execute('kept@example.com', $user->id);

    expect($response->status())->toBe(200);
    expect($response->getData(true)['unique'])->toBeTrue();
});

test('empty email returns bad request', function () {
    $action = new CheckEmailUniquenessAction();

    $response = $action->execute('');

    expect($response->status())->toBe(400);
    $payload = $response->getData(true);
    expect($payload['unique'])->toBeFalse();
    expect($payload['error'])->toBe('No email provided');
});
