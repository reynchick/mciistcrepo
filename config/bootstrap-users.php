<?php

return [
    'administrator' => [
        'email' => env('BOOTSTRAP_ADMIN_EMAIL'),
        'lookup_email' => env('BOOTSTRAP_ADMIN_LOOKUP_EMAIL'),
        'first_name' => env('BOOTSTRAP_ADMIN_FIRST_NAME'),
        'middle_name' => env('BOOTSTRAP_ADMIN_MIDDLE_NAME'),
        'last_name' => env('BOOTSTRAP_ADMIN_LAST_NAME'),
        'contact_number' => env('BOOTSTRAP_ADMIN_CONTACT_NUMBER'),
    ],
    'staff' => [
        'email' => env('BOOTSTRAP_STAFF_EMAIL'),
        'lookup_email' => env('BOOTSTRAP_STAFF_LOOKUP_EMAIL'),
        'first_name' => env('BOOTSTRAP_STAFF_FIRST_NAME'),
        'middle_name' => env('BOOTSTRAP_STAFF_MIDDLE_NAME'),
        'last_name' => env('BOOTSTRAP_STAFF_LAST_NAME'),
        'contact_number' => env('BOOTSTRAP_STAFF_CONTACT_NUMBER'),
    ],
];
