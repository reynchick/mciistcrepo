<?php

return [
    'defaults' => [
        'create' => 'draft',
        'seed' => 'published',
        'restore' => 'published',
    ],

    'statuses' => [
        'draft' => [
            'label' => 'Draft',
            'public' => false,
            'badge' => 'gray',
        ],
        'submitted' => [
            'label' => 'Submitted',
            'public' => false,
            'badge' => 'amber',
        ],
        'published' => [
            'label' => 'Published',
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
            'to' => ['submitted', 'published'],
            'submitted' => ['roles' => ['faculty', 'student', 'staff']],
            'published' => ['roles' => ['staff']],
        ],
        'submitted' => [
            'to' => ['published', 'returned'],
            'published' => ['roles' => ['staff']],
            'returned' => ['roles' => ['staff']],
        ],
        'returned' => [
            'to' => ['submitted'],
            'submitted' => ['roles' => ['faculty', 'student', 'staff']],
        ],
        'published' => [
            'to' => ['archived'],
            'archived' => ['roles' => ['staff']],
        ],
        'archived' => [
            'to' => ['published'],
            'published' => ['roles' => ['staff']],
        ],
    ],

    'entry_modes' => [
        'faculty_student' => [
            'label' => 'Faculty / Student',
            'who_can_set' => ['faculty', 'staff'],
        ],
        'faculty_only' => [
            'label' => 'Faculty Only',
            'who_can_set' => ['faculty', 'staff'],
        ],
        'guest' => [
            'label' => 'Guest',
            'who_can_set' => ['staff'],
        ],
        'staff_direct_publish' => [
            'label' => 'Staff Direct Publish',
            'who_can_set' => ['staff'],
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
        ['value' => 'submitted', 'label' => 'Submitted'],
        ['value' => 'published', 'label' => 'Published'],
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
        'published' => [
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
        'published_year',
    ],

    'draft_requirements' => [
        'research_title',
        'research_abstract',
        'program_id',
    ],
];
