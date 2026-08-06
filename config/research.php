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
        'draft_invited' => [
            'label' => 'Draft (Invited)',
            'public' => false,
            'badge' => 'blue',
        ],
        'submitted' => [
            'label' => 'Submitted',
            'public' => false,
            'badge' => 'amber',
        ],
        'posted' => [
            'label' => 'Posted',
            'public' => true,
            'badge' => 'green',
        ],
        'returned' => [
            'label' => 'Returned',
            'public' => false,
            'badge' => 'rose',
        ],
        'archived' => [
            'label' => 'Archived',
            'public' => false,
            'badge' => 'slate',
        ],
    ],

    'transitions' => [
        'draft' => [
            'to' => ['draft_invited', 'posted', 'archived'],
            'draft_invited' => ['roles' => ['faculty', 'staff']],
            'posted' => ['roles' => ['faculty', 'staff']],
            'archived' => ['roles' => ['staff']],
        ],
        'draft_invited' => [
            'to' => ['submitted', 'posted', 'archived'],
            'submitted' => ['roles' => ['student', 'faculty', 'staff']],
            'posted' => ['roles' => ['faculty', 'staff']],
            'archived' => ['roles' => ['staff']],
        ],
        'submitted' => [
            'to' => ['returned', 'posted', 'archived'],
            'returned' => ['roles' => ['faculty', 'staff']],
            'posted' => ['roles' => ['faculty', 'staff']],
            'archived' => ['roles' => ['staff']],
        ],
        'returned' => [
            'to' => ['submitted', 'posted', 'archived'],
            'submitted' => ['roles' => ['faculty', 'student', 'staff']],
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
        'submit' => 'Submit',
        'return' => 'Return',
        'publish' => 'Publish',
        'archive' => 'Archive',
        'restore' => 'Restore',
        'request_adviser_metadata' => 'Request adviser metadata',
        'hard_delete' => 'Hard delete',
    ],

    'status_filter_options' => [
        ['value' => 'all', 'label' => 'All statuses'],
        ['value' => 'draft', 'label' => 'Draft'],
        ['value' => 'draft_invited', 'label' => 'Draft (Invited)'],
        ['value' => 'submitted', 'label' => 'Submitted'],
        ['value' => 'posted', 'label' => 'Posted'],
        ['value' => 'returned', 'label' => 'Returned'],
        ['value' => 'archived', 'label' => 'Archived'],
    ],

    'edit_rules' => [
        'draft' => [
            'faculty' => ['can_edit' => true, 'can_submit' => true, 'can_publish' => false],
            'staff' => ['can_edit' => true, 'can_submit' => true, 'can_publish' => true],
            'guest' => ['can_edit' => false],
        ],
        'submitted' => [
            'faculty' => ['can_edit' => false, 'can_submit' => false, 'can_publish' => false],
            'staff' => ['can_edit' => true, 'can_return' => true, 'can_publish' => true],
        ],
        'posted' => [
            'faculty' => ['can_edit' => false, 'can_request_metadata' => true],
            'staff' => ['can_edit' => true, 'can_archive' => true],
            'guest' => ['can_view' => true],
        ],
        'returned' => [
            'faculty' => ['can_edit' => true, 'can_submit' => true],
            'staff' => ['can_edit' => true, 'can_publish' => true],
        ],
        'archived' => [
            'faculty' => ['can_view' => true],
            'staff' => ['can_restore' => true, 'can_view' => true],
        ],
    ],

    'publish_requirements' => [
        'research_title',
        'research_abstract',
        'program_id',
        'research_adviser',
        'research_manuscript',
        'completed_year',
    ],

    'draft_requirements' => [
        'research_title',
        'research_abstract',
        'program_id',
    ],
];
