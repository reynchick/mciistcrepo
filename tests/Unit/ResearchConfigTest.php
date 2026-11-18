<?php

test('research workflow configuration exposes the expected defaults and workflow keys', function () {
    $config = config('research');

    expect($config)->toBeArray()
        ->and($config['defaults']['create'])->toBe('draft')
        ->and($config['defaults']['seed'])->toBe('posted')
        ->and($config['defaults']['restore'])->toBe('draft')
        ->and($config['statuses']['draft']['label'])->toBe('Draft')
        ->and($config['statuses']['posted']['public'])->toBeTrue()
        ->and(array_keys($config['statuses']))->toBe(['draft', 'posted', 'archived'])
        ->and($config['transitions']['draft']['to'])->toContain('posted')
        ->and(array_keys($config['transitions']))->toBe(['draft', 'posted', 'archived'])
        ->and($config['log_actions'])->toHaveKeys(['posted', 'archive', 'restore', 'request_adviser_metadata', 'hard_delete'])
        ->and($config['post_requirements'])->toContain('research_manuscript');
});
