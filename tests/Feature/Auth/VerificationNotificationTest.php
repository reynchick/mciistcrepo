<?php

/*
|--------------------------------------------------------------------------
| Verification Notification Tests (Skipped)
|--------------------------------------------------------------------------
| This app uses Google-only authentication (OAuth), so email verification
| tests are not applicable. These tests are skipped intentionally.
*/

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('sends verification notification', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not email verification.');
});

test('does not send verification notification if email is verified', function () {
    $this->markTestSkipped('App uses Google OAuth authentication, not email verification.');
});