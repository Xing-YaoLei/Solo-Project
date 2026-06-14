<?php

namespace App\Http\Controllers;

use App\Models\TimeSlot;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class CalendarController extends Controller
{
    protected $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    public function index(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfWeek()->toDateString());
        $endDate = $request->input('end_date', now()->endOfWeek()->addDays(7)->toDateString());

        $view = $request->input('view', 'week');

        if ($view === 'month') {
            $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
            $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());
        }

        $calendarData = $this->bookingService->getCalendarData($startDate, $endDate, $request->all());

        $timeSlots = TimeSlot::active()->orderBy('start_time')->get();

        $capacityData = [];
        $currentDate = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        while ($currentDate->lte($end)) {
            $dateStr = $currentDate->toDateString();
            $capacityData[$dateStr] = $this->bookingService->getTimeSlotCapacityInfo($dateStr);
            $currentDate->addDay();
        }

        return Inertia::render('Calendar/Index', [
            'calendarData' => $calendarData,
            'timeSlots' => $timeSlots,
            'capacityData' => $capacityData,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'view' => $view,
            'filters' => $request->only(['status', 'assigned_to', 'source_channel']),
        ]);
    }
}
