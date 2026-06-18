<?php

return [

    'domain' => env('HORIZON_DOMAIN'),

    'path' => env('HORIZON_PATH', 'horizon'),

    'uses' => 'default',

    'prefix' => env('HORIZON_PREFIX', 'solo_testdrive:'),

    'middleware' => ['web'],

    'waits' => [
        'redis:default' => 60,
        'redis:test-drive' => 120,
        'redis:notification' => 60,
        'redis:report' => 300,
    ],

    'trim' => [
        'recent' => 60,
        'pending' => 60,
        'completed' => 60 * 24 * 7,
        'recent_failed' => 60 * 24 * 7,
        'failed' => 60 * 24 * 14,
        'monitored' => 60 * 24 * 7,
    ],

    'tags' => [
        'resolved' => [
            'App\Jobs\ScanNoShowTestDrives',
            'App\Jobs\SendTestDriveReminders',
        ],
        'slow' => [
            'App\Jobs\GenerateWeeklyConversionReport',
        ],
        'notification' => [
            'App\Jobs\NotifyFollowupOverdue',
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['test-drive', 'notification', 'report', 'default'],
                'balance' => 'auto',
                'processes' => 10,
                'tries' => 3,
                'timeout' => 120,
                'memory' => 512,
            ],
        ],

        'local' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['test-drive', 'notification', 'report', 'default'],
                'balance' => 'auto',
                'processes' => 3,
                'tries' => 1,
                'timeout' => 120,
            ],
        ],
    ],

];
