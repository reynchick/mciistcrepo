<?php

/*
|--------------------------------------------------------------------------
| Email Verification Tests (Skipped)
|--------------------------------------------------------------------------
| This app uses Google-only authentication (OAuth), so email verification
| tests are not applicable. These tests are skipped intentionally.
*/

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('email verification screen can be rendered', function () {
    $this->markTestSkipped('App uses Google OAuth authentication with automatic email verification.');
});

test('email can be verified', function () {
    $this->markTestSkipped('App uses Google OAuth authentication with automatic email verification.');
});

test('email is not verified with invalid hash', function () {
    $this->markTestSkipped('App uses Google OAuth authentication with automatic email verification.');
});

test('email is not verified with invalid user id', function () {
    $this->markTestSkipped('App uses Google OAuth authentication with automatic email verification.');
});

test('verified user is redirected to dashboard from verification prompt', function () {
    $this->markTestSkipped('App uses Google OAuth authentication with automatic email verification.');
});

test('already verified user visiting verification link is redirected without firing event again', function () {
    $this->markTestSkipped('App uses Google OAuth authentication with automatic email verification.');
});