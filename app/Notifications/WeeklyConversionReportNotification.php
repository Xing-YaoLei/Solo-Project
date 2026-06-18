<?php

namespace App\Notifications;

use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class WeeklyConversionReportNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public array $stats, public Store $store) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'weekly_conversion_report',
            'store_id' => $this->store->id,
            'store_name' => $this->store->name,
            'title' => "【周报】{$this->store->name} 转化分析报告",
            'period' => $this->stats['period'],
            'summary' => [
                '新增客户' => $this->stats['customers']['new_total'],
                '高意向占比' => $this->stats['customers']['high_intent_ratio'] . '%',
                '试驾预约' => $this->stats['test_drives']['booked'],
                '试驾完成' => $this->stats['test_drives']['completed'],
                '爽约率' => $this->stats['test_drives']['no_show_rate'] . '%',
                '预约→完成转化' => $this->stats['test_drives']['conversion_from_booking'] . '%',
                '跟进总数' => $this->stats['followups']['total'],
            ],
            'full_stats' => $this->stats,
            'action_url' => '/dashboard',
        ];
    }
}
