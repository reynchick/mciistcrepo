<?php

test('research workflow configuration exposes the expected defaults and workflow keys', function () {
    $config = config('research');

    expect($config)->toBeArray()
        ->and($config['defaults']['create'])->toBe('draft')
        ->and($config['defaults']['seed'])->toBe('posted')
        ->and($config['defaults']['restore'])->toBe('draft')
        ->and($config['statuses']['draft']['label'])->toBe('Draft')
        ->and($config['statuses']['posted']['public'])->toBeTrue()
        ->and($config['transitions']['draft']['to'])->toContain('submitted')
        ->and($config['log_actions'])->toHaveKeys(['submit', 'return', 'publish', 'archive', 'restore', 'request_adviser_metadata', 'hard_delete'])
        ->and($config['publish_requirements'])->toContain('research_manuscript')
        ->and($config['draft_requirements'])->toContain('research_title');
});
