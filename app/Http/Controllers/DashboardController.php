<?php

namespace App\Http\Controllers;

use App\Models\Anomaly;
use App\Models\Vehicle;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $stats = [
            'total_vehicles' => Vehicle::count(),
            'in_stock' => Vehicle::inStock()->count(),
            'pending' => Vehicle::status(Vehicle::STATUS_PENDING)->count(),
            'preparing' => Vehicle::status(Vehicle::STATUS_PREPARING)->count(),
            'available' => Vehicle::status(Vehicle::STATUS_AVAILABLE)->count(),
            'sold_this_month' => Vehicle::status(Vehicle::STATUS_SOLD)
                ->whereMonth('sold_date', now()->month)
                ->whereYear('sold_date', now()->year)
                ->count(),
            'open_anomalies' => Anomaly::whereIn('status', ['open', 'in_progress', 'escalated'])->count(),
            'high_severity_anomalies' => Anomaly::whereIn('severity', ['high', 'critical'])
                ->whereIn('status', ['open', 'in_progress', 'escalated'])
                ->count(),
        ];

        $stats['stock_value'] = Vehicle::inStock()->sum('purchase_price');
        $stats['sold_revenue_this_month'] = Vehicle::status(Vehicle::STATUS_SOLD)
            ->whereMonth('sold_date', now()->month)
            ->whereYear('sold_date', now()->year)
            ->sum('actual_sale_price');

        $vehiclesByStatus = Vehicle::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $inventoryTurnover = $this->calculateInventoryTurnover();

        $recentVehicles = Vehicle::with(['appraiser:id,name', 'sales:id,name'])
            ->latest()
            ->limit(10)
            ->get()
            ->map->append(['days_in_stock', 'status_label', 'preparation_cost', 'total_cost']);

        $recentAnomalies = Anomaly::with(['vehicle:id,brand,model,plate_no,vin', 'handler:id,name'])
            ->whereIn('status', ['open', 'in_progress', 'escalated'])
            ->latest()
            ->limit(10)
            ->get()
            ->map->append(['status_label', 'severity_label', 'type_label']);

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'vehiclesByStatus' => $vehiclesByStatus,
            'inventoryTurnover' => $inventoryTurnover,
            'recentVehicles' => $recentVehicles,
            'recentAnomalies' => $recentAnomalies,
            'userRole' => $user->roleLabel(),
            'permissions' => [
                'can_create_vehicle' => $user->hasPermission('vehicle.create') || $user->isManager(),
                'can_manage_anomaly' => $user->hasPermission('anomaly.manage') || $user->isManager(),
                'can_view_statistics' => $user->hasPermission('statistics.view') || $user->isManager(),
            ],
        ]);
    }

    private function calculateInventoryTurnover(): array
    {
        $months = collect(range(5, 0))->map(function ($i) {
            return now()->subMonths($i)->format('Y-m');
        });

        $data = [];
        foreach ($months as $month) {
            $startOfMonth = now()->parse($month . '-01')->startOfMonth();
            $endOfMonth = now()->parse($month . '-01')->endOfMonth();

            $soldCount = Vehicle::status(Vehicle::STATUS_SOLD)
                ->whereBetween('sold_date', [$startOfMonth, $endOfMonth])
                ->count();

            $avgStock = Vehicle::where(function ($q) use ($startOfMonth, $endOfMonth) {
                $q->where('arrival_date', '<=', $endOfMonth)
                    ->where(function ($q2) use ($startOfMonth) {
                        $q2->whereNull('sold_date')
                            ->orWhere('sold_date', '>=', $startOfMonth);
                    });
            })->count();

            $turnoverDays = $soldCount > 0 ? round($avgStock * 30 / $soldCount, 1) : null;

            $data[] = [
                'month' => $month,
                'sold_count' => $soldCount,
                'avg_stock' => $avgStock,
                'turnover_days' => $turnoverDays,
            ];
        }

        return $data;
    }
}
