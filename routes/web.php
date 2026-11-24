<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StaffDashboardController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Logs\LogController;
use App\Http\Controllers\Auth\CompleteFacultyProfileController;
use App\Http\Controllers\ResearchController;
use App\Http\Controllers\LibrarianResearchMetadataController;
use App\Http\Controllers\ResearchDownloadController;
use App\Http\Controllers\ResearchSearchController;
use App\Http\Controllers\ManuscriptPreviewController;
use App\Http\Controllers\ReportGenerationController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ResearchAlignmentManagementController;

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
Route::middleware('throttle:manuscript-preview')->group(function () {
    Route::get('/research/{research}/preview', [ManuscriptPreviewController::class, 'metadata'])
        ->name('research.preview');
    Route::get('/research/{research}/preview/pages/{page}', [ManuscriptPreviewController::class, 'page'])
        ->whereNumber('page')
        ->name('research.preview.page');
});

Route::get('/api/search-suggestions', [ResearchSearchController::class, 'searchSuggestions'])
    ->name('search.suggestions');
Route::get('/api/keyword-suggestions', [ResearchSearchController::class, 'keywordSuggestions'])
    ->name('keyword.suggestions');
Route::post('/api/keyword-search', [ResearchSearchController::class, 'logKeywordSearch'])
    ->name('keyword.search.log');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    Route::get('/csrf-token', fn () => response()->json(['token' => csrf_token()]))
        ->name('csrf.token');

    // Profile completion
    Route::get('/faculty/profile/complete', [CompleteFacultyProfileController::class, 'show'])
        ->name('faculty.profile.complete');
    Route::post('/faculty/profile/complete', [CompleteFacultyProfileController::class, 'store'])
        ->name('faculty.profile.complete.store');

    // Role-specific browse pages
    Route::get('/faculty/browse', [ResearchSearchController::class, 'browse'])->name('faculty.browse');
    Route::get('/student/browse', [ResearchSearchController::class, 'browse'])->name('student.browse');
    Route::get('/staff/browse', [ResearchSearchController::class, 'browse'])->name('staff.browse');

    // Research downloads and export
    Route::prefix('research')->name('research.')->group(function () {
        Route::get('export', [ResearchDownloadController::class, 'export'])->name('export');
        Route::get('{research}/manuscript', [ResearchDownloadController::class, 'downloadPdf'])
            ->name('manuscript.download');
    });

    // Research management
    Route::get('/staff/research', [ResearchController::class, 'manage'])->name('staff.research');
    Route::middleware('role:Librarian')->prefix('librarian')->name('librarian.')->group(function () {
        Route::get('/research', [LibrarianResearchMetadataController::class, 'index'])->name('research.index');
        Route::get('/research/{research}/metadata', [LibrarianResearchMetadataController::class, 'edit'])
            ->name('research.metadata.edit');
        Route::put('/research/{research}/metadata', [LibrarianResearchMetadataController::class, 'update'])
            ->name('research.metadata.update');
    });
    Route::get('/faculty/my-researches', [ResearchController::class, 'facultyMyResearches'])
        ->name('faculty.my-researches');
    Route::get('/student/my-researches', [ResearchController::class, 'studentMyResearches'])
        ->name('student.my-researches');
    Route::get('/research/{research}/edit-data', [ResearchController::class, 'editData'])
        ->name('research.edit-data');

    // Dashboards
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/programs/{program}/trend', [DashboardController::class, 'programTrend'])
        ->name('dashboard.programs.trend');

    Route::get('/faculty/dashboard', [DashboardController::class, 'index'])->name('faculty.dashboard');
    Route::get('/staff/dashboard', [StaffDashboardController::class, 'index'])
        ->middleware('role:MCIIS Staff')
        ->name('staff.dashboard');

    // Faculty directory
    Route::get('/staff/faculty', [FacultyController::class, 'index'])->name('staff.faculty');
    Route::get('/faculty/faculty-list', [FacultyController::class, 'index'])->name('faculty.faculty-list');
    Route::get('/student/faculty', [FacultyController::class, 'index'])->name('student.faculty');
    Route::put('/faculty/my-profile', [FacultyController::class, 'updateOwnProfile'])
        ->name('faculty.my-profile.update');

    Route::resource('faculty', FacultyController::class);
    Route::post('/faculty/bulk-destroy', [FacultyController::class, 'bulkDestroy'])
        ->name('faculty.bulk-destroy');
    Route::get('/api/faculty/by-email', [FacultyController::class, 'findByEmail'])
        ->name('faculty.by-email');

    // Research workflow
    Route::get('/research/check-title', [ResearchController::class, 'checkTitle'])
        ->name('research.check-title');
    Route::post('/research/{research}/request-adviser-metadata', [ResearchController::class, 'requestAdviserMetadata'])
        ->name('research.request-adviser-metadata');
    Route::post('/research/{research}/post', [ResearchController::class, 'post'])
        ->name('research.post');
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

    Route::middleware('role:Administrator')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/students/import/template', [StudentController::class, 'downloadTemplate'])
            ->name('students.import.template');
        Route::post('/students/import/csv', [StudentController::class, 'importCsv'])
            ->name('students.import.csv');
        Route::post('/students/{student}/approve-access', [StudentController::class, 'approveAccess'])
            ->name('students.approve-access');
        Route::post('/students/{student}/revoke-access', [StudentController::class, 'revokeAccess'])
            ->name('students.revoke-access');
        Route::resource('students', StudentController::class)->except(['show']);

        Route::prefix('research-alignments')->name('research-alignments.')->group(function () {
            Route::get('/', [ResearchAlignmentManagementController::class, 'index'])->name('index');

            Route::post('/sdgs', [ResearchAlignmentManagementController::class, 'storeSdg'])->name('sdgs.store');
            Route::put('/sdgs/{sdg}', [ResearchAlignmentManagementController::class, 'updateSdg'])->name('sdgs.update');
            Route::delete('/sdgs/{sdg}', [ResearchAlignmentManagementController::class, 'destroySdg'])->name('sdgs.destroy');

            Route::post('/srigs', [ResearchAlignmentManagementController::class, 'storeSrig'])->name('srigs.store');
            Route::put('/srigs/{srig}', [ResearchAlignmentManagementController::class, 'updateSrig'])->name('srigs.update');
            Route::delete('/srigs/{srig}', [ResearchAlignmentManagementController::class, 'destroySrig'])->name('srigs.destroy');

            Route::post('/agendas', [ResearchAlignmentManagementController::class, 'storeAgenda'])->name('agendas.store');
            Route::put('/agendas/{agenda}', [ResearchAlignmentManagementController::class, 'updateAgenda'])->name('agendas.update');
            Route::delete('/agendas/{agenda}', [ResearchAlignmentManagementController::class, 'destroyAgenda'])->name('agendas.destroy');
        });
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
    Route::redirect('/logs', '/logs/user-audit')->name('logs.root');
    Route::get('/logs/{type}', [LogController::class, 'index'])->name('logs.index');
    Route::get('/logs/{type}/{id}/download', [LogController::class, 'download'])->name('logs.download');
    Route::get('/logs/{type}/{id}/details', [LogController::class, 'show'])->name('logs.show');

    // Authenticated research-access logging
    Route::post('/api/research-access', [ResearchSearchController::class, 'logAccess'])
        ->name('research.access.log');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
