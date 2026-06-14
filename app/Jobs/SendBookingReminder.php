<?php

namespace App\Jobs;

use App\Models\TrialBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendBookingReminder implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $booking;
    public $reminderType;

    public function __construct(TrialBooking $booking, string $reminderType = '24h')
    {
        $this->booking = $booking;
        $this->reminderType = $reminderType;
    }

    public function handle(): void
    {
        $booking = $this->booking->fresh();
        if (!$booking || !in_array($booking->status, [
            TrialBooking::STATUS_PENDING,
            TrialBooking::STATUS_CONFIRMED,
        ])) {
            return;
        }

        Log::info('发送预约提醒', [
            'booking_id' => $booking->id,
            'booking_no' => $booking->booking_no,
            'student_name' => $booking->student_name,
            'phone' => $booking->phone,
            'reminder_type' => $this->reminderType,
            'trial_date' => $booking->trial_date,
            'time_slot' => $booking->timeSlot?->name,
        ]);
    }
}
