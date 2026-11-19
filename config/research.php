<?php

return [
    'defaults' => [
        'create' => 'draft',
        'seed' => 'posted',
        'restore' => 'draft',
    ],

    'statuses' => [
        'draft' => [
            'label' => 'Draft',
            'public' => false,
            'badge' => 'gray',
        ],
        'posted' => [
            'label' => 'Posted',
            'public' => true,
            'badge' => 'green',
        ],
        'archived' => [
            'label' => 'Archived',
            'public' => false,
            'badge' => 'slate',
        ],
    ],

    'transitions' => [
        'draft' => [
            'to' => ['posted', 'archived'],
            'posted' => ['roles' => ['faculty', 'staff']],
            'archived' => ['roles' => ['staff']],
        ],
        'posted' => [
            'to' => ['archived'],
            'archived' => ['roles' => ['staff']],
        ],
        'archived' => [
            'to' => ['draft'],
            'draft' => ['roles' => ['staff']],
        ],
    ],

    'log_actions' => [
        'posted' => 'Posted',
        'archive' => 'Archive',
        'restore' => 'Restore',
        'request_adviser_metadata' => 'Request adviser metadata',
        'hard_delete' => 'Hard delete',
    ],

    'status_filter_options' => [
        ['value' => 'all', 'label' => 'All statuses'],
        ['value' => 'draft', 'label' => 'Draft'],
        ['value' => 'posted', 'label' => 'Posted'],
        ['value' => 'archived', 'label' => 'Archived'],
    ],

    'post_requirements' => [
        'research_title',
        'research_abstract',
        'program_id',
        'research_adviser',
        'research_manuscript',
        'completed_year',
    ],

    'required_metadata_terms' => [
        'title',
        'creator',
        'description',
        'date',
    ],

];
