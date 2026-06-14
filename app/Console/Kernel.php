<?php

namespace App\Console;

use App\Jobs\DetectBookingConflicts;
use App\Jobs\SendBookingReminder;
use App\Models\TrialBooking;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->call(function () {
            $bookings = TrialBooking::whereIn('status', [
                TrialBooking::STATUS_PENDING,
                TrialBooking::STATUS_CONFIRMED,
            ])
            ->where('trial_date', '>=', now()->toDateString())
            ->where('trial_date', '<=', now()->addDays(7)->toDateString())
            ->get();

            foreach ($bookings as $booking) {
                DetectBookingConflicts::dispatch($booking);
            }
        })->hourly()->name('detect-conflicts')->withoutOverlapping();

        $schedule->call(function () {
            $tomorrow = now()->addDay()->toDateString();

            $bookings = TrialBooking::whereIn('status', [
                TrialBooking::STATUS_PENDING,
                TrialBooking::STATUS_CONFIRMED,
            ])
            ->where('trial_date', $tomorrow)
            ->get();

            foreach ($bookings as $booking) {
                SendBookingReminder::dispatch($booking, '24h');
            }
        })->dailyAt('09:00')->name('send-reminders-24h');

        $schedule->call(function () {
            $today = now()->toDateString();

            $bookings = TrialBooking::whereIn('status', [
                TrialBooking::STATUS_PENDING,
                TrialBooking::STATUS_CONFIRMED,
            ])
            ->where('trial_date', $today)
            ->get();

            foreach ($bookings as $booking) {
                SendBookingReminder::dispatch($booking, 'today');
            }
        })->dailyAt('08:00')->name('send-reminders-today');
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
