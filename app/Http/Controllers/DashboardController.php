<?php

namespace App\Http\Controllers;

use App\Models\TrialBooking;
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

        $query = TrialBooking::with(['course', 'timeSlot', 'assignedTo', 'createdBy'])
            ->withCount('conflicts')
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
            ->when($request->input('source_channel'), function ($q) use ($request) {
                $q->where('source_channel', $request->input('source_channel'));
            })
            ->when($request->input('assigned_to'), function ($q) use ($request) {
                $q->where('assigned_to', $request->input('assigned_to'));
            })
            ->orderBy('trial_date', 'desc')
            ->orderBy('time_slot_id')
            ->paginate(20);

        $statusGroups = [
            'to_handle' => [
                'label' => '待处理',
                'count' => TrialBooking::byGroup('to_handle')->count(),
            ],
            'need_info' => [
                'label' => '补资料',
                'count' => TrialBooking::byGroup('need_info')->count(),
            ],
            'escalated' => [
                'label' => '升级复核',
                'count' => TrialBooking::byGroup('escalated')->count(),
            ],
            'completed' => [
                'label' => '已完成',
                'count' => TrialBooking::byGroup('completed')->count(),
            ],
            'closed' => [
                'label' => '已关闭',
                'count' => TrialBooking::byGroup('closed')->count(),
            ],
        ];

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'bookings' => $query,
            'statusGroups' => $statusGroups,
            'currentGroup' => $group,
            'filters' => $request->only(['search', 'source_channel', 'assigned_to', 'start_date', 'end_date']),
        ]);
    }
}
