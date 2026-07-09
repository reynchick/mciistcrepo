<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Guest routes (login and Google OAuth)
Route::middleware('guest')->group(function () {
    // Login page (Google SSO only)
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    // Google OAuth routes
    Route::get('auth/google', [GoogleAuthController::class, 'redirect'])
        ->name('auth.google');

    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])
        ->name('auth.google.callback');

    // Minimal password reset request endpoint (not used - Google OAuth only)
    Route::get('forgot-password', function () {
        return response('Password reset not available - using Google OAuth', 200);
    })->name('password.request');

    // Minimal reset password form endpoint (not used - Google OAuth only)
    Route::get('reset-password/{token}', function ($token) {
        return response('Password reset not available - using Google OAuth', 200);
    })->name('password.reset');

    // Minimal registration endpoints (not used - Google OAuth only)
    Route::get('register', function () {
        return response('Registration not available - using Google OAuth', 200);
    })->name('register');

    Route::post('register', function (Request $request) {
        return redirect()->route('login');
    })->name('register.store');
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
