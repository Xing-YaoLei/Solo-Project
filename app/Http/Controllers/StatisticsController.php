<?php

namespace App\Http\Controllers;

use App\Services\StatisticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StatisticsController extends Controller
{
    protected $statisticsService;

    public function __construct(StatisticsService $statisticsService)
    {
        $this->statisticsService = $statisticsService;
    }

    public function index(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());

        $overview = $this->statisticsService->getOverviewStats($startDate, $endDate);
        $bySourceChannel = $this->statisticsService->getBySourceChannel($startDate, $endDate);
        $byAssignee = $this->statisticsService->getByAssignee($startDate, $endDate);
        $reviewTags = $this->statisticsService->getReviewTags($startDate, $endDate);
        $byTimeSlot = $this->statisticsService->getByTimeSlot($startDate, $endDate);
        $dailyTrend = $this->statisticsService->getDailyTrend($startDate, $endDate);
        $attendanceRateByDate = $this->statisticsService->getAttendanceRateByDate($startDate, $endDate);

        return Inertia::render('Statistics/Index', [
            'overview' => $overview,
            'bySourceChannel' => $bySourceChannel,
            'byAssignee' => $byAssignee,
            'reviewTags' => $reviewTags,
            'byTimeSlot' => $byTimeSlot,
            'dailyTrend' => $dailyTrend,
            'attendanceRateByDate' => $attendanceRateByDate,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
