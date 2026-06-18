<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('horizon:snapshot')->everyFiveMinutes();

Schedule::call(function () {
    \App\Jobs\ScanNoShowTestDrives::dispatch();
})->everyThirtyMinutes()->name('scan-no-show-testdrives');

Schedule::call(function () {
    $reminderHours = [2, 24];
    foreach ($reminderHours as $h) {
        \App\Jobs\SendTestDriveReminders::dispatch($h);
    }
})->everyMinute()->name('send-testdrive-reminders');

Schedule::call(function () {
    \App\Jobs\NotifyFollowupOverdue::dispatch();
})->dailyAt('09:00')->name('notify-followup-overdue');

Schedule::call(function () {
    \App\Jobs\GenerateWeeklyConversionReport::dispatch();
})->weeklyOn(1, '08:00')->name('generate-weekly-conversion-report');
