<?php


namespace App\Providers;


use App\Models\{
    Agenda,
    CompiledReport,
    Faculty,
    Keyword,
    Program,
    Research,
    Researcher,
    Role,
    SDG,
    SRIG,
    User,
    UserAuditLog
};
use App\Policies\{
    AgendaPolicy,
    CompiledReportPolicy,
    FacultyPolicy,
    KeywordPolicy,
    ProgramPolicy,
    ResearchPolicy,
    ResearcherPolicy,
    RolePolicy,
    SDGPolicy,
    SRIGPolicy,
    UserPolicy
};


use App\Observers\{
    FacultyObserver,
    ResearchObserver,
    UserObserver
};


use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Event;
use App\Events\ResearchAccessed;
use App\Events\KeywordSearched;
use App\Events\UserRoleAttached;
use App\Events\UserRoleDetached;
use App\Listeners\LogResearchAccess;
use App\Listeners\LogKeywordSearch;
use App\Listeners\LogUserRoleAttached;
use App\Listeners\LogUserRoleDetached;
use Illuminate\Support\ServiceProvider;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }


    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(CompiledReport::class, CompiledReportPolicy::class);
        Gate::policy(Faculty::class, FacultyPolicy::class);
        Gate::policy(Keyword::class, KeywordPolicy::class);
        Gate::policy(Program::class, ProgramPolicy::class);
        Gate::policy(Research::class, ResearchPolicy::class);
        Gate::policy(Researcher::class, ResearcherPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        User::observe(UserObserver::class);
        Faculty::observe(FacultyObserver::class);
        Research::observe(ResearchObserver::class);


        Gate::define('viewLogs', function (User $user) {
            return $user->isAdministrator();
        });

        // Register event listeners for access/search logging
        Event::listen(ResearchAccessed::class, [LogResearchAccess::class, 'handle']);
        Event::listen(KeywordSearched::class, [LogKeywordSearch::class, 'handle']);
        
        // Register event listeners for user role changes
        Event::listen(UserRoleAttached::class, [LogUserRoleAttached::class, 'handle']);
        Event::listen(UserRoleDetached::class, [LogUserRoleDetached::class, 'handle']);

        // Dispatch custom events when pivot events occur (use generic listener and filter relation)
        Event::listen('eloquent.attached: App\Models\User', function ($model, $relationName, $ids) {
            if ($relationName === 'roles') {
                event(new UserRoleAttached($model, $ids));
            }
        });

        Event::listen('eloquent.detached: App\Models\User', function ($model, $relationName, $ids) {
            if ($relationName === 'roles') {
                event(new UserRoleDetached($model, $ids));
            }
        });
    }
}