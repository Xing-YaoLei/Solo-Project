<?php

namespace App\Http\Controllers;

use App\Models\Anomaly;
use App\Models\PreparationItem;
use App\Models\QuoteHistory;
use App\Models\Vehicle;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsController extends Controller
{
    public function index(Request $request): Response
    {
        if (!auth()->user()->isManager() && !auth()->user()->isFinance() && !auth()->user()->hasPermission('statistics.view')) {
            abort(403);
        }

        $period = $request->input('period', 'month');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $dateRange = $this->getDateRange($period, $dateFrom, $dateTo);

        $overview = $this->getOverviewStats($dateRange);
        $inventoryTurnover = $this->getInventoryTurnover($dateRange);
        $vehicleStats = $this->getVehicleStatistics($dateRange);
        $anomalyStats = $this->getAnomalyStatistics($dateRange);
        $profitAnalysis = $this->getProfitAnalysis($dateRange);
        $topModels = $this->getTopModels($dateRange);

        return Inertia::render('Statistics/Index', [
            'overview' => $overview,
            'inventoryTurnover' => $inventoryTurnover,
            'vehicleStats' => $vehicleStats,
            'anomalyStats' => $anomalyStats,
            'profitAnalysis' => $profitAnalysis,
            'topModels' => $topModels,
            'filters' => [
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    public function inventoryDetail(Request $request): Response
    {
        if (!auth()->user()->isManager() && !auth()->user()->isFinance() && !auth()->user()->hasPermission('statistics.view')) {
            abort(403);
        }

        $query = Vehicle::inStock()
            ->with(['appraiser:id,name', 'sales:id,name'])
            ->whereNotNull('arrival_date');

        if ($days = $request->input('over_days')) {
            $query->whereRaw('DATEDIFF(IFNULL(sold_date, CURDATE()), arrival_date) >= ?', [$days]);
        }

        if ($brand = $request->input('brand')) {
            $query->where('brand', $brand);
        }

        $vehicles = $query->orderByRaw('DATEDIFF(IFNULL(sold_date, CURDATE()), arrival_date) DESC')
            ->paginate(30)
            ->withQueryString();

        $vehicles->getCollection()->transform(function ($v) {
            return $v->append(['days_in_stock', 'status_label', 'preparation_cost', 'total_cost']);
        });

        return Inertia::render('Statistics/InventoryDetail', [
            'vehicles' => $vehicles,
            'filters' => $request->only(['over_days', 'brand']),
            'brands' => Vehicle::distinct()->orderBy('brand')->pluck('brand'),
        ]);
    }

    private function getDateRange(string $period, ?string $dateFrom, ?string $dateTo): array
    {
        if ($dateFrom && $dateTo) {
            return [now()->parse($dateFrom)->startOfDay(), now()->parse($dateTo)->endOfDay()];
        }

        return match ($period) {
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            'quarter' => [now()->startOfQuarter(), now()->endOfQuarter()],
            'year' => [now()->startOfYear(), now()->endOfYear()],
            default => [now()->startOfMonth(), now()->endOfMonth()],
        };
    }

    private function getOverviewStats(array $range): array
    {
        [$start, $end] = $range;

        $acquired = Vehicle::whereBetween('arrival_date', [$start, $end])->count();
        $acquiredValue = Vehicle::whereBetween('arrival_date', [$start, $end])->sum('purchase_price');

        $sold = Vehicle::status(Vehicle::STATUS_SOLD)->whereBetween('sold_date', [$start, $end])->count();
        $revenue = Vehicle::status(Vehicle::STATUS_SOLD)->whereBetween('sold_date', [$start, $end])->sum('actual_sale_price');
        $cost = Vehicle::status(Vehicle::STATUS_SOLD)
            ->whereBetween('sold_date', [$start, $end])
            ->get()
            ->sum(fn ($v) => $v->total_cost);

        $profit = $revenue - $cost;
        $profitMargin = $cost > 0 ? round(($profit / $cost) * 100, 2) : 0;

        $avgTurnoverDays = Vehicle::status(Vehicle::STATUS_SOLD)
            ->whereBetween('sold_date', [$start, $end])
            ->whereNotNull('arrival_date')
            ->get()
            ->avg(fn ($v) => $v->arrival_date->diffInDays($v->sold_date));

        return [
            'acquired' => $acquired,
            'acquired_value' => round($acquiredValue, 2),
            'sold' => $sold,
            'revenue' => round($revenue, 2),
            'cost' => round($cost, 2),
            'profit' => round($profit, 2),
            'profit_margin' => $profitMargin,
            'avg_turnover_days' => round($avgTurnoverDays ?? 0, 1),
            'in_stock' => Vehicle::inStock()->count(),
            'stock_value' => round(Vehicle::inStock()->sum('purchase_price'), 2),
        ];
    }

    private function getInventoryTurnover(array $range): array
    {
        [$start, $end] = $range;
        $data = [];

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dayStart = $date->copy()->startOfDay();
            $dayEnd = $date->copy()->endOfDay();

            $stock = Vehicle::where(function ($q) use ($dayEnd, $dayStart) {
                $q->where('arrival_date', '<=', $dayEnd)
                    ->where(function ($q2) use ($dayStart) {
                        $q2->whereNull('sold_date')
                            ->orWhere('sold_date', '>=', $dayStart);
                    });
            })->count();

            $sold = Vehicle::status(Vehicle::STATUS_SOLD)
                ->whereBetween('sold_date', [$dayStart, $dayEnd])
                ->count();

            $data[] = [
                'date' => $date->format('Y-m-d'),
                'stock' => $stock,
                'sold' => $sold,
            ];
        }

        return $data;
    }

    private function getVehicleStatistics(array $range): array
    {
        [$start, $end] = $range;

        $byBrand = Vehicle::selectRaw('brand, COUNT(*) as count, SUM(purchase_price) as total_value')
            ->whereBetween('arrival_date', [$start, $end])
            ->groupBy('brand')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $statusDistribution = Vehicle::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'by_brand' => $byBrand,
            'status_distribution' => $statusDistribution,
        ];
    }

    private function getAnomalyStatistics(array $range): array
    {
        [$start, $end] = $range;

        $total = Anomaly::whereBetween('created_at', [$start, $end])->count();
        $resolved = Anomaly::whereBetween('created_at', [$start, $end])
            ->whereIn('status', ['resolved', 'closed'])
            ->count();
        $open = $total - $resolved;

        $byType = Anomaly::selectRaw('type, COUNT(*) as count')
            ->whereBetween('created_at', [$start, $end])
            ->groupBy('type')
            ->pluck('count', 'type');

        $avgResolutionHours = Anomaly::whereBetween('created_at', [$start, $end])
            ->whereNotNull('resolved_at')
            ->get()
            ->avg(fn ($a) => $a->created_at->diffInHours($a->resolved_at));

        return [
            'total' => $total,
            'open' => $open,
            'resolved' => $resolved,
            'resolution_rate' => $total > 0 ? round(($resolved / $total) * 100, 1) : 0,
            'avg_resolution_hours' => round($avgResolutionHours ?? 0, 1),
            'by_type' => $byType,
        ];
    }

    private function getProfitAnalysis(array $range): array
    {
        [$start, $end] = $range;
        $data = [];

        $soldVehicles = Vehicle::status(Vehicle::STATUS_SOLD)
            ->whereBetween('sold_date', [$start, $end])
            ->get()
            ->map(fn ($v) => $v->append(['profit', 'profit_margin']));

        $profitRanges = [
            ['label' => '亏损', 'min' => null, 'max' => 0, 'count' => 0],
            ['label' => '0-5%', 'min' => 0, 'max' => 5, 'count' => 0],
            ['label' => '5-10%', 'min' => 5, 'max' => 10, 'count' => 0],
            ['label' => '10-15%', 'min' => 10, 'max' => 15, 'count' => 0],
            ['label' => '15%+', 'min' => 15, 'max' => null, 'count' => 0],
        ];

        foreach ($soldVehicles as $vehicle) {
            $margin = $vehicle->profit_margin ?? -1;
            foreach ($profitRanges as &$range) {
                if ($range['min'] === null && $margin < $range['max']) {
                    $range['count']++;
                    break;
                }
                if ($range['max'] === null && $margin >= $range['min']) {
                    $range['count']++;
                    break;
                }
                if ($range['min'] !== null && $range['max'] !== null && $margin >= $range['min'] && $margin < $range['max']) {
                    $range['count']++;
                    break;
                }
            }
        }

        return [
            'total_sold' => $soldVehicles->count(),
            'avg_profit' => round($soldVehicles->avg('profit') ?? 0, 2),
            'avg_profit_margin' => round($soldVehicles->avg('profit_margin') ?? 0, 2),
            'profit_ranges' => $profitRanges,
        ];
    }

    private function getTopModels(array $range): array
    {
        [$start, $end] = $range;

        return Vehicle::status(Vehicle::STATUS_SOLD)
            ->selectRaw('brand, model, COUNT(*) as sold_count, AVG(DATEDIFF(sold_date, arrival_date)) as avg_turnover_days')
            ->whereBetween('sold_date', [$start, $end])
            ->groupBy('brand', 'model')
            ->orderByDesc('sold_count')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                return [
                    'brand' => $row->brand,
                    'model' => $row->model,
                    'sold_count' => $row->sold_count,
                    'avg_turnover_days' => round($row->avg_turnover_days, 1),
                ];
            })
            ->toArray();
    }
}
