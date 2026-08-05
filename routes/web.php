<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StaffDashboardController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Logs\LogController;
use App\Http\Controllers\Auth\CompleteStudentProfileController;
use App\Http\Controllers\Auth\CompleteFacultyProfileController;
use App\Http\Controllers\ResearchController;
use App\Http\Controllers\ResearchDownloadController;
use App\Http\Controllers\ResearchSearchController;
use App\Http\Controllers\ReportGenerationController;
use App\Http\Controllers\GuestFileRequestController;

/*
|--------------------------------------------------------------------------
| Public / guest-accessible routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/browse', [ResearchSearchController::class, 'browse'])->name('browse');
Route::get('/research/{research}/details', [ResearchSearchController::class, 'details'])
    ->name('research.details');

Route::get('/api/search-suggestions', [ResearchSearchController::class, 'searchSuggestions'])
    ->name('search.suggestions');
Route::get('/api/keyword-suggestions', [ResearchSearchController::class, 'keywordSuggestions'])
    ->name('keyword.suggestions');
Route::post('/api/keyword-search', [ResearchSearchController::class, 'logKeywordSearch'])
    ->name('keyword.search.log');

Route::post('/guest/research/{research}/request', [GuestFileRequestController::class, 'request'])
    ->name('guest.research.request');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    // Profile completion
    Route::get('/student/profile/complete', [CompleteStudentProfileController::class, 'show'])
        ->name('student.profile.complete');
    Route::post('/student/profile/complete', [CompleteStudentProfileController::class, 'store'])
        ->name('student.profile.complete.store');

    Route::get('/faculty/profile/complete', [CompleteFacultyProfileController::class, 'show'])
        ->name('faculty.profile.complete');
    Route::post('/faculty/profile/complete', [CompleteFacultyProfileController::class, 'store'])
        ->name('faculty.profile.complete.store');

    // Role-specific browse pages
    Route::get('/faculty/browse', [ResearchSearchController::class, 'browse'])->name('faculty.browse');
    Route::get('/student/browse', [ResearchSearchController::class, 'browse'])->name('student.browse');
    Route::get('/staff/browse', [ResearchSearchController::class, 'browse'])->name('staff.browse');

    // Guest file-request approval
    Route::post('/guest/file-requests/{guestFileRequest}/approve', [GuestFileRequestController::class, 'approve'])
        ->name('guest.file-requests.approve');

    // Research downloads and export
    Route::prefix('research')->name('research.')->group(function () {
        Route::get('export', [ResearchDownloadController::class, 'export'])->name('export');
        Route::get('{research}/manuscript', [ResearchDownloadController::class, 'downloadPdf'])
            ->name('manuscript.download');
        Route::get('{research}/approval-sheet', [ResearchDownloadController::class, 'downloadApprovalSheet'])
            ->name('approval.download');
    });

    // Research management
    Route::get('/staff/research', [ResearchController::class, 'manage'])->name('staff.research');
    Route::get('/faculty/my-researches', [ResearchController::class, 'facultyMyResearches'])
        ->name('faculty.my-researches');
    Route::get('/research/{research}/edit-data', [ResearchController::class, 'editData'])
        ->name('research.edit-data');

    // Dashboards
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/programs/{program}/trend', [DashboardController::class, 'programTrend'])
        ->name('dashboard.programs.trend');

    Route::get('/faculty/dashboard', [DashboardController::class, 'index'])->name('faculty.dashboard');
    Route::get('/student/dashboard', [DashboardController::class, 'student'])->name('student.dashboard');

    Route::get('/staff/dashboard', [StaffDashboardController::class, 'index'])
        ->middleware('role:MCIIS Staff')
        ->name('staff.dashboard');

    // Faculty directory
    Route::get('/staff/faculty', [FacultyController::class, 'index'])->name('staff.faculty');
    Route::get('/faculty/faculty-list', [FacultyController::class, 'index'])->name('faculty.faculty-list');
    Route::get('/student/faculty', [FacultyController::class, 'index'])->name('student.faculty');

    Route::resource('faculty', FacultyController::class);
    Route::post('/faculty/bulk-destroy', [FacultyController::class, 'bulkDestroy'])
        ->name('faculty.bulk-destroy');
    Route::get('/api/faculty/by-email', [FacultyController::class, 'findByEmail'])
        ->name('faculty.by-email');

    // Research workflow
    Route::get('/research/check-title', [ResearchController::class, 'checkTitle'])
        ->name('research.check-title');
    Route::get('/research/invitation/{token}', [ResearchController::class, 'invitation'])
        ->name('research.invitation');
    Route::post('/research/{research}/submit', [ResearchController::class, 'submit'])
        ->name('research.submit');
    Route::post('/research/{research}/return', [ResearchController::class, 'returnForRevision'])
        ->name('research.return');
    Route::post('/research/{research}/request-adviser-metadata', [ResearchController::class, 'requestAdviserMetadata'])
        ->name('research.request-adviser-metadata');
    Route::post('/research/{research}/publish', [ResearchController::class, 'publish'])
        ->name('research.publish');
    Route::post('/research/{research}/archive', [ResearchController::class, 'archive'])
        ->name('research.archive');
    Route::post('/research/{research}/restore', [ResearchController::class, 'restore'])
        ->name('research.restore');
    Route::post('/research/{research}/status', [ResearchController::class, 'updateStatus'])
        ->name('research.status');
    Route::delete('/research/{research}/force', [ResearchController::class, 'forceDelete'])
        ->name('research.force-delete');
    Route::get('/research/{research}/status-history', [ResearchController::class, 'statusHistory'])
        ->name('research.status-history');

    Route::resource('research', ResearchController::class);

    // Reports
    Route::prefix('admin')->group(function () {
        Route::get('/reports', [ReportGenerationController::class, 'index'])->name('admin.reports.index');
        Route::get('/reports/export-matrix', [ReportGenerationController::class, 'exportMatrix'])
            ->name('admin.reports.export-matrix');
        Route::get('/reports/export-compiled', [ReportGenerationController::class, 'exportCompiled'])
            ->name('admin.reports.export-compiled');
    });

    Route::prefix('staff')->group(function () {
        Route::get('/reports', [ReportGenerationController::class, 'index'])->name('staff.reports.index');
        Route::get('/reports/export-matrix', [ReportGenerationController::class, 'exportMatrix'])
            ->name('staff.reports.export-matrix');
        Route::get('/reports/export-compiled', [ReportGenerationController::class, 'exportCompiled'])
            ->name('staff.reports.export-compiled');
    });

    // Users
    Route::get('/users/suggestions', [UserController::class, 'suggestions'])->name('users.suggestions');
    Route::get('/users/check-email', [UserController::class, 'checkEmail'])->name('users.check-email');
    Route::get('/users/check-student-id', [UserController::class, 'checkStudentId'])
        ->name('users.check-student-id');

    Route::resource('users', UserController::class);
    Route::post('/users/{user}/restore', [UserController::class, 'restore'])
        ->name('users.restore')
        ->withTrashed();

    // Logs
    Route::get('/logs/{type}', [LogController::class, 'index'])->name('logs.index');
    Route::get('/logs/{type}/{id}/details', [LogController::class, 'show'])->name('logs.show');

    // Authenticated research-access logging
    Route::post('/api/research-access', [ResearchSearchController::class, 'logAccess'])
        ->name('research.access.log');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';