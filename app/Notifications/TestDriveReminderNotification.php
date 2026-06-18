<?php

namespace App\Notifications;

use App\Models\TestDrive;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TestDriveReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public TestDrive $testDrive, public int $hoursBefore = 2) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'test_drive_reminder',
            'test_drive_id' => $this->testDrive->id,
            'test_drive_code' => $this->testDrive->code,
            'hours_before' => $this->hoursBefore,
            'title' => "试驾前{$this->hoursBefore}小时提醒",
            'message' => sprintf(
                '%s 将于 %s 试驾 %s %s，请提前准备',
                $this->testDrive->customer?->name ?? '客户',
                $this->testDrive->appointment_at?->format('m-d H:i'),
                $this->testDrive->vehicle?->brand,
                $this->testDrive->vehicle?->model
            ),
            'customer_name' => $this->testDrive->customer?->name,
            'customer_phone' => $this->testDrive->customer?->phone,
            'vehicle_name' => $this->testDrive->vehicle?->brand . ' ' . $this->testDrive->vehicle?->model,
            'appointment_at' => $this->testDrive->appointment_at,
            'action_url' => '/test-drives/' . $this->testDrive->id,
        ];
    }
}
