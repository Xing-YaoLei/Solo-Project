<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class FollowupOverdueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Collection $followups, public User $user) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'followup_overdue',
            'title' => "您有 {$this->followups->count()} 条跟进逾期",
            'message' => "请尽快处理逾期跟进，建议今日优先联系客户",
            'overdue_count' => $this->followups->count(),
            'oldest_date' => $this->followups->min('next_followup_at'),
            'action_url' => '/followups?is_overdue=1&user_id=' . $this->user->id,
        ];
    }
}
