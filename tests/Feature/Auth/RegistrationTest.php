<?php

/*
|--------------------------------------------------------------------------
| Registration Tests (Skipped)
|--------------------------------------------------------------------------
| This app uses Google-only authentication (OAuth), so registration
| tests are not applicable. These tests are skipped intentionally.
*/

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('registration screen can be rendered', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not password-based registration.');
});

test('new users can register', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not password-based registration.');
});