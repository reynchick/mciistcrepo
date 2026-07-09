<?php

/*
|--------------------------------------------------------------------------
| Authentication Tests (Skipped)
|--------------------------------------------------------------------------
| This app uses Google-only authentication (OAuth), so standard Breeze-style
| password login tests are not applicable. These tests are skipped intentionally.
*/

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('login screen can be rendered', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard email/password login.');
});

test('users can authenticate using the login screen', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard email/password login.');
});

test('users can not authenticate with invalid password', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard email/password login.');
});

test('users can logout', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard email/password login.');
});

test('users are rate limited', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard email/password login.');
});