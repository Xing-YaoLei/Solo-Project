<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class FollowupOverdueManagerNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Collection $followups, public User $salesUser, public User $manager) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'followup_overdue_manager',
            'title' => "团队跟进预警：{$this->salesUser->name} 逾期 {$this->followups->count()} 条",
            'message' => "已达到需主管关注阈值（3条以上），请及时介入",
            'sales_user_id' => $this->salesUser->id,
            'sales_user_name' => $this->salesUser->name,
            'overdue_count' => $this->followups->count(),
            'action_url' => '/followups?user_id=' . $this->salesUser->id . '&is_overdue=1',
        ];
    }
}
