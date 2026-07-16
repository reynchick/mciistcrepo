<?php

use App\Http\Controllers\Logs\LogController;
use App\Models\User;
use App\Models\UserAuditLog;

it('hydrates user display names for audit log rows', function () {
    $controller = new LogController();
    $log = new UserAuditLog();
    $log->setAttribute('target_user_id', 42);
    $log->setAttribute('modified_by', 7);

    $targetUser = new User();
    $targetUser->forceFill([
        'first_name' => 'Jane',
        'middle_name' => 'A.',
        'last_name' => 'Doe',
    ]);

    $modifiedByUser = new User();
    $modifiedByUser->forceFill([
        'first_name' => 'John',
        'last_name' => 'Smith',
    ]);

    $log->setRelation('targetUser', $targetUser);
    $log->setRelation('modifiedByUser', $modifiedByUser);

    $method = new ReflectionMethod(LogController::class, 'hydrateLogDisplayAttributes');
    $method->setAccessible(true);
    $method->invoke($controller, $log);

    expect($log->getAttribute('target_user_name'))->toBe('Jane A. Doe')
        ->and($log->getAttribute('modified_by_user_name'))->toBe('John Smith');
});

it('hydrates researcher names from a collection of researchers', function () {
    $controller = new LogController();

    $firstResearcher = new User();
    $firstResearcher->forceFill([
        'first_name' => 'Jane',
        'last_name' => 'Doe',
    ]);

    $secondResearcher = new User();
    $secondResearcher->forceFill([
        'first_name' => 'John',
        'last_name' => 'Smith',
    ]);

    $method = new ReflectionMethod(LogController::class, 'resolveResearcherNames');
    $method->setAccessible(true);

    $result = $method->invoke($controller, collect([$firstResearcher, $secondResearcher]));

    expect($result)->toBe('Jane Doe, John Smith');
});
