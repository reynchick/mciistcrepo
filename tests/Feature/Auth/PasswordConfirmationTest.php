<?php

/*
|--------------------------------------------------------------------------
| Password Confirmation Tests (Skipped)
|--------------------------------------------------------------------------
| This app uses Google-only authentication (OAuth), so password confirmation
| tests are not applicable. These tests are skipped intentionally.
*/

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('confirm password screen can be rendered', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard password confirmation.');
});

test('password can be confirmed', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard password confirmation.');
});

test('password is not confirmed with invalid password', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not standard password confirmation.');
});