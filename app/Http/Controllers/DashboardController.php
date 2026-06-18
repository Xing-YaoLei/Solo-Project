<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use App\Enums\TestDriveStatus;
use App\Enums\IntentLevel;
use App\Models\TestDrive;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\SalesFollowup;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = $request->user()->store_id;

        $today = now()->toDateString();
        $startOfMonth = now()->startOfMonth()->toDateString();
        $endOfMonth = now()->endOfMonth()->toDateString();

        $baseTestDrive = TestDrive::when($storeId, fn($q) => $q->where('store_id', $storeId));
        $baseCustomer = Customer::when($storeId, fn($q) => $q->where('store_id', $storeId));
        $baseFollowup = SalesFollowup::when($storeId, fn($q) => $q->where('store_id', $storeId));

        $stats = [
            'today_appointments' => (clone $baseTestDrive)->whereDate('appointment_at', $today)->count(),
            'pending_confirm' => (clone $baseTestDrive)->where('status', TestDriveStatus::PENDING->value)->count(),
            'completed_month' => (clone $baseTestDrive)
                ->whereBetween('appointment_at', [$startOfMonth, $endOfMonth])
                ->where('status', TestDriveStatus::COMPLETED->value)
                ->count(),
            'no_show_month' => (clone $baseTestDrive)
                ->whereBetween('appointment_at', [$startOfMonth, $endOfMonth])
                ->where('is_no_show', true)
                ->count(),
            'new_customers_month' => (clone $baseCustomer)
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->count(),
            'high_intent_customers' => (clone $baseCustomer)
                ->whereIn('intent_level', [IntentLevel::HIGH->value, IntentLevel::VERY_HIGH->value, IntentLevel::DEPOSITED->value])
                ->count(),
            'pending_followups' => (clone $baseFollowup)
                ->where('next_followup_at', '<=', now()->addDays(3))
                ->where('status', 1)
                ->count(),
            'total_vehicles_available' => Vehicle::when($storeId, fn($q) => $q->where('store_id', $storeId))
                ->where('status', 1)
                ->where('is_test_drive_eligible', true)
                ->count(),
        ];

        $noShowRate = $stats['completed_month'] + $stats['no_show_month'] > 0
            ? round(($stats['no_show_month'] / ($stats['completed_month'] + $stats['no_show_month'])) * 100, 1)
            : 0;

        $trendData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $trendData[] = [
                'date' => $date,
                'appointments' => (clone $baseTestDrive)->whereDate('appointment_at', $date)->count(),
                'completed' => (clone $baseTestDrive)->whereDate('appointment_at', $date)
                    ->where('status', TestDriveStatus::COMPLETED->value)->count(),
                'no_show' => (clone $baseTestDrive)->whereDate('appointment_at', $date)
                    ->where('is_no_show', true)->count(),
            ];
        }

        $conversionFunnel = [
            'total_leads' => (clone $baseCustomer)->count(),
            'test_drive_booked' => (clone $baseCustomer)->whereHas('testDrives')->count(),
            'test_drive_completed' => (clone $baseTestDrive)->where('status', TestDriveStatus::COMPLETED->value)->distinct('customer_id')->count('customer_id'),
            'high_intent_after' => (clone $baseCustomer)->whereIn('intent_level', [IntentLevel::VERY_HIGH->value, IntentLevel::DEPOSITED->value])->count(),
        ];

        $upcomingAppointments = (clone $baseTestDrive)
            ->with(['customer:id,name,phone', 'vehicle:id,brand,model,plate_number', 'salesUser:id,name'])
            ->whereBetween('appointment_at', [now(), now()->addDays(7)])
            ->whereIn('status', [TestDriveStatus::PENDING->value, TestDriveStatus::CONFIRMED->value])
            ->orderBy('appointment_at')
            ->limit(10)
            ->get();

        $noShowRecent = (clone $baseTestDrive)
            ->with(['customer:id,name,phone', 'vehicle:id,brand,model', 'assignedUser:id,name'])
            ->where('is_no_show', true)
            ->whereNull('responsibility_role')
            ->orderBy('appointment_at', 'desc')
            ->limit(8)
            ->get();

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'noShowRate' => $noShowRate,
            'trendData' => $trendData,
            'conversionFunnel' => $conversionFunnel,
            'upcomingAppointments' => $upcomingAppointments,
            'noShowRecent' => $noShowRecent,
            'statusOptions' => collect(TestDriveStatus::cases())->map(fn($s) => ['value' => $s->value, 'label' => $s->label()]),
        ]);
    }
}
