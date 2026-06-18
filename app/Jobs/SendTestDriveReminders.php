<?php

namespace App\Jobs;

use App\Enums\TestDriveStatus;
use App\Enums\TimelineCategory;
use App\Models\TestDrive;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendTestDriveReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $hoursBefore = 2) {}

    public function handle(): void
    {
        $now = now();
        $startWindow = $now->copy()->addHours($this->hoursBefore)->subMinutes(30);
        $endWindow = $now->copy()->addHours($this->hoursBefore)->addMinutes(30);

        $appointments = TestDrive::whereBetween('appointment_at', [$startWindow, $endWindow])
            ->whereIn('status', [TestDriveStatus::PENDING->value, TestDriveStatus::CONFIRMED->value])
            ->whereDoesntHave('timelines', function ($q) {
                $q->where('category', TimelineCategory::CUSTOMER->value)
                  ->where('action_name', 'like', '%提醒%')
                  ->where('created_at', '>=', now()->subDay());
            })
            ->with(['customer', 'vehicle', 'salesUser', 'assignedUser'])
            ->get();

        foreach ($appointments as $td) {
            $recipients = collect();
            if ($td->salesUser) $recipients->push($td->salesUser);
            if ($td->assignedUser && $td->assignedUser->id !== $td->sales_user_id) {
                $recipients->push($td->assignedUser);
            }
            if ($td->companion_user_id) {
                $companion = User::find($td->companion_user_id);
                if ($companion) $recipients->push($companion);
            }

            if ($recipients->isNotEmpty()) {
                try {
                    Notification::send($recipients->unique('id'), new \App\Notifications\TestDriveReminderNotification($td, $this->hoursBefore));
                } catch (\Throwable $e) {
                    Log::warning('TestDriveReminder notification failed', ['id' => $td->id, 'error' => $e->getMessage()]);
                }
            }

            $td->addTimeline(
                TimelineCategory::CUSTOMER,
                10,
                "发送试驾前{$this->hoursBefore}小时提醒",
                sprintf('客户：%s；车辆：%s %s；预约时间：%s',
                    $td->customer?->name,
                    $td->vehicle?->brand,
                    $td->vehicle?->model,
                    $td->appointment_at
                ),
                'reminder_sent', null, true
            );
        }
    }
}
