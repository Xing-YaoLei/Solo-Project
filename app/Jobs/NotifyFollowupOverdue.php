<?php

namespace App\Jobs;

use App\Models\SalesFollowup;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class NotifyFollowupOverdue implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $overdue = SalesFollowup::where('next_followup_at', '<', now())
            ->where('status', 1)
            ->with(['customer', 'user', 'user.manager'])
            ->get();

        $groupedByUser = $overdue->groupBy('user_id');

        foreach ($groupedByUser as $userId => $followups) {
            $user = User::find($userId);
            if (!$user) continue;

            try {
                Notification::send([$user], new \App\Notifications\FollowupOverdueNotification($followups, $user));
            } catch (\Throwable $e) {
                Log::warning('Overdue followup notification failed', ['user' => $userId, 'error' => $e->getMessage()]);
            }

            if ($user->reporting_to) {
                $manager = User::find($user->reporting_to);
                if ($manager && $followups->count() >= 3) {
                    try {
                        Notification::send([$manager], new \App\Notifications\FollowupOverdueManagerNotification($followups, $user, $manager));
                    } catch (\Throwable $e) {
                        Log::warning('Manager overdue notification failed', ['error' => $e->getMessage()]);
                    }
                }
            }
        }
    }
}
