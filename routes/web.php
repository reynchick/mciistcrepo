<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Logs\LogController;
use App\Http\Controllers\Auth\CompleteStudentProfileController;
use App\Http\Controllers\Auth\CompleteFacultyProfileController;
use App\Http\Controllers\ResearchController;
use App\Http\Controllers\ResearchDownloadController;
use App\Http\Controllers\ResearchSearchController;
use App\Http\Controllers\BrowseController;
use App\Http\Controllers\ReportGenerationController;

/*
 |---------------------------------------------------------------------------
 | Authenticated routes
 |---------------------------------------------------------------------------
 |
 | Profile completion, dashboard, resource routes and log endpoints are
 | protected by the auth middleware.
 |
 */
Route::get('/', function () { return redirect()->route('browse'); })->name('welcome');
    Route::middleware(['auth'])->group(function () {
    // Profile completion (authentication flow for new users)
    // Student profile completion
    Route::get('/student/profile/complete', [CompleteStudentProfileController::class, 'show'])->name('student.profile.complete');
    Route::post('/student/profile/complete', [CompleteStudentProfileController::class, 'store'])->name('student.profile.complete.store');

     // Faculty profile completion
    Route::get('/faculty/profile/complete', [CompleteFacultyProfileController::class, 'show'])->name('faculty.profile.complete');
    Route::post('/faculty/profile/complete', [CompleteFacultyProfileController::class, 'store'])->name('faculty.profile.complete.store');

    // Landing page (Browse grid with filters)
    Route::get('/browse', [ResearchSearchController::class, 'browse'])->name('browse');
    
    // Faculty browse (same as main browse)
    Route::get('/faculty/browse', [ResearchSearchController::class, 'browse'])->name('faculty.browse');
    
    // Student browse (same as main browse)
    Route::get('/student/browse', [ResearchSearchController::class, 'browse'])->name('student.browse');
    
    // Staff browse (same as main browse)
    Route::get('/staff/browse', [ResearchSearchController::class, 'browse'])->name('staff.browse');

    // Inline research details & file downloads
    Route::get('/research/{research}/details', [ResearchSearchController::class, 'details'])->name('research.details');

    // Research downloads and export
    Route::prefix('research')->name('research.')->group(function () {
        Route::get('export', [ResearchDownloadController::class, 'export'])->name('export');
        Route::get('{research}/manuscript', [ResearchDownloadController::class, 'downloadPdf'])->name('manuscript.download');
        Route::get('{research}/approval-sheet', [ResearchDownloadController::class, 'downloadApprovalSheet'])->name('approval.download');
    });
    
    // Admin/Staff/Faculty/Student Dashboard (role-adaptive)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Faculty resource routes
    Route::resource('faculty', FacultyController::class);
    Route::post('/faculty/bulk-destroy', [FacultyController::class, 'bulkDestroy'])->name('faculty.bulk-destroy');

    // Faculty lookup by email (for user creation)
    Route::get('/api/faculty/by-email', [FacultyController::class, 'findByEmail'])->name('faculty.by-email');

    // Research resource routes
    Route::resource('research', ResearchController::class);

    // Research matrix reports
    Route::get('/reports', [ReportGenerationController::class, 'index'])->name('reports.index');
    Route::get('/reports/export-pdf', [ReportGenerationController::class, 'exportPdf'])->name('reports.export-pdf');
    Route::get('/reports/export-compilation', [ReportGenerationController::class, 'exportCompilation'])->name('reports.export-compilation');

    // User search suggestions (must be before resource route to avoid conflict)
    Route::get('/users/suggestions', [UserController::class, 'suggestions'])->name('users.suggestions');

    // User email uniqueness check (AJAX)
    Route::get('/users/check-email', [UserController::class, 'checkEmail'])->name('users.check-email');
    
    // User student ID uniqueness check (AJAX)
    Route::get('/users/check-student-id', [UserController::class, 'checkStudentId'])->name('users.check-student-id');
    
    // User resource routes (Admin only)
    Route::resource('users', UserController::class);

    // User restore route (Admin only)
    Route::post('/users/{user}/restore', [UserController::class, 'restore'])->name('users.restore')->withTrashed();

    // Unified log routes (handles all 5 log types)
    Route::get('/logs/{type}', [LogController::class, 'index'])->name('logs.index');
    Route::get('/logs/{type}/{id}/details', [LogController::class, 'show'])->name('logs.show');

    // Research access logging (auth required)
    Route::post('/api/research-access', [ResearchSearchController::class, 'logAccess'])->name('research.access.log');

    // Unified search suggestions (typed autocomplete)
    Route::get('/api/search-suggestions', [ResearchSearchController::class, 'searchSuggestions'])->name('search.suggestions');

    // Keyword-only suggestions
    Route::get('/api/keyword-suggestions', [ResearchSearchController::class, 'keywordSuggestions'])->name('keyword.suggestions');
    
    // Keyword search logging (on submit)
    Route::post('/api/keyword-search', [ResearchSearchController::class, 'logKeywordSearch'])->name('keyword.search.log');

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
