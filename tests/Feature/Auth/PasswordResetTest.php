<?php

/*
|--------------------------------------------------------------------------
| Password Reset Tests (Skipped)
|--------------------------------------------------------------------------
| This app uses Google-only authentication (OAuth), so password reset
| tests are not applicable. These tests are skipped intentionally.
*/

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('reset password link screen can be rendered', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not password reset flows.');
});

test('reset password link can be requested', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not password reset flows.');
});

test('reset password screen can be rendered', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not password reset flows.');
});

test('password can be reset with valid token', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not password reset flows.');
});

test('password cannot be reset with invalid token', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not password reset flows.');
});