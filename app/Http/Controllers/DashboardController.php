<?php

namespace App\Http\Controllers;

use App\Models\TrialBooking;
use App\Models\TimeSlot;
use App\Models\AuditLog;
use App\Services\BookingService;
use App\Services\StatisticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    protected $bookingService;
    protected $statisticsService;

    public function __construct(BookingService $bookingService, StatisticsService $statisticsService)
    {
        $this->bookingService = $bookingService;
        $this->statisticsService = $statisticsService;
    }

    public function index(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());
        $group = $request->input('group', 'to_handle');

        $stats = $this->statisticsService->getOverviewStats($startDate, $endDate);

        $dateFilter = $request->input('date_filter', 'all');
        $today = now()->toDateString();

        $query = TrialBooking::with(['course', 'timeSlot', 'assignedTo', 'createdBy', 'conflicts'])
            ->when($group, function ($q) use ($group) {
                $q->byGroup($group);
            })
            ->when($request->input('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($subQ) use ($search) {
                    $subQ->where('student_name', 'like', "%{$search}%")
                        ->orWhere('parent_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('booking_no', 'like', "%{$search}%");
                });
            })
            ->when($dateFilter === 'today', function ($q) use ($today) {
                $q->where('trial_date', $today);
            })
            ->when($dateFilter === 'week', function ($q) {
                $q->whereBetween('trial_date', [
                    now()->startOfWeek()->toDateString(),
                    now()->endOfWeek()->toDateString(),
                ]);
            })
            ->when($dateFilter === 'month', function ($q) {
                $q->whereMonth('trial_date', now()->month)
                    ->whereYear('trial_date', now()->year);
            })
            ->when($request->input('source_channel'), function ($q) use ($request) {
                $q->where('source_channel', $request->input('source_channel'));
            })
            ->when($request->input('assigned_to'), function ($q) use ($request) {
                $q->where('assigned_to', $request->input('assigned_to'));
            })
            ->orderBy('trial_date', 'desc')
            ->orderBy('time_slot_id')
            ->paginate(20);

        $groupCounts = [
            'to_handle' => TrialBooking::byGroup('to_handle')->count(),
            'need_info' => TrialBooking::byGroup('need_info')->count(),
            'escalated' => TrialBooking::byGroup('escalated')->count(),
            'completed' => TrialBooking::byGroup('completed')->count(),
            'closed' => TrialBooking::byGroup('closed')->count(),
        ];

        $todayTimeSlots = $this->bookingService->getTimeSlotCapacityInfo($today);

        $recentLogs = AuditLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'details' => $log->details,
                    'created_at' => $log->created_at,
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                    ] : null,
                ];
            });

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'bookings' => $query,
            'groupCounts' => (object)$groupCounts,
            'todayTimeSlots' => $todayTimeSlots,
            'recentLogs' => $recentLogs,
            'currentGroup' => $group,
            'filters' => $request->only(['search', 'source_channel', 'assigned_to', 'start_date', 'end_date', 'date_filter']),
        ]);
    }

    protected function getDayType($date)
    {
        $dayOfWeek = date('N', strtotime($date));
        return $dayOfWeek >= 6 ? 'weekend' : 'weekday';
    }
}
