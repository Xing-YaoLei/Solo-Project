<?php

namespace App\Jobs;

use App\Enums\TestDriveStatus;
use App\Enums\IntentLevel;
use App\Models\TestDrive;
use App\Models\Customer;
use App\Models\SalesFollowup;
use App\Models\Store;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class GenerateWeeklyConversionReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $startOfWeek = now()->startOfWeek()->subWeek();
        $endOfWeek = now()->endOfWeek()->subWeek();

        $stores = Store::where('status', 1)->get();

        foreach ($stores as $store) {
            $stats = [
                'period' => ['start' => $startOfWeek->toDateString(), 'end' => $endOfWeek->toDateString()],
                'store' => $store->only(['id', 'name', 'code']),
                'customers' => [
                    'new_total' => Customer::where('store_id', $store->id)->whereBetween('created_at', [$startOfWeek, $endOfWeek])->count(),
                    'high_intent_ratio' => $this->safeRatio(
                        Customer::where('store_id', $store->id)->whereBetween('created_at', [$startOfWeek, $endOfWeek])->whereIn('intent_level', [IntentLevel::HIGH->value, IntentLevel::VERY_HIGH->value, IntentLevel::DEPOSITED->value])->count(),
                        Customer::where('store_id', $store->id)->whereBetween('created_at', [$startOfWeek, $endOfWeek])->count()
                    ),
                ],
                'test_drives' => [
                    'booked' => TestDrive::where('store_id', $store->id)->whereBetween('appointment_at', [$startOfWeek, $endOfWeek])->count(),
                    'completed' => TestDrive::where('store_id', $store->id)->whereBetween('appointment_at', [$startOfWeek, $endOfWeek])->where('status', TestDriveStatus::COMPLETED->value)->count(),
                    'no_show' => TestDrive::where('store_id', $store->id)->whereBetween('appointment_at', [$startOfWeek, $endOfWeek])->where('is_no_show', true)->count(),
                    'no_show_rate' => 0,
                    'conversion_from_booking' => 0,
                ],
                'followups' => [
                    'total' => SalesFollowup::where('store_id', $store->id)->whereBetween('followup_at', [$startOfWeek, $endOfWeek])->count(),
                    'avg_per_customer' => 0,
                ],
                'by_sales' => [],
            ];

            $stats['test_drives']['no_show_rate'] = $this->safeRatio(
                $stats['test_drives']['no_show'],
                $stats['test_drives']['booked']
            );
            $stats['test_drives']['conversion_from_booking'] = $this->safeRatio(
                $stats['test_drives']['completed'],
                $stats['test_drives']['booked']
            );

            $salesUsers = User::where('store_id', $store->id)->whereHas('roles', fn($q) => $q->where('name', 'sales'))->get();
            foreach ($salesUsers as $su) {
                $stats['by_sales'][] = [
                    'user_id' => $su->id,
                    'name' => $su->name,
                    'test_drives_completed' => TestDrive::where('sales_user_id', $su->id)->whereBetween('appointment_at', [$startOfWeek, $endOfWeek])->where('status', TestDriveStatus::COMPLETED->value)->count(),
                    'test_drives_no_show' => TestDrive::where('sales_user_id', $su->id)->whereBetween('appointment_at', [$startOfWeek, $endOfWeek])->where('is_no_show', true)->count(),
                    'followups_done' => SalesFollowup::where('user_id', $su->id)->whereBetween('followup_at', [$startOfWeek, $endOfWeek])->count(),
                    'followups_overdue' => SalesFollowup::where('user_id', $su->id)->where('next_followup_at', '<', $endOfWeek)->where('status', 1)->count(),
                ];
            }

            $admins = User::role(['admin', 'operation_manager'])->get();
            $storeManager = User::find($store->manager_name); // 简化：通知admin和operation_manager及店长

            try {
                $recipients = $admins->merge([$storeManager])->filter()->unique('id');
                if ($recipients->isNotEmpty()) {
                    Notification::send($recipients->values()->all(), new \App\Notifications\WeeklyConversionReportNotification($stats, $store));
                }
            } catch (\Throwable $e) {
                Log::warning('Weekly report notification failed', ['store' => $store->id, 'error' => $e->getMessage()]);
            }

            Log::info('Weekly conversion report generated', ['store_id' => $store->id, 'stats' => $stats]);
        }
    }

    private function safeRatio(int $a, int $b): float
    {
        if ($b <= 0) return 0;
        return round(($a / $b) * 100, 1);
    }
}
