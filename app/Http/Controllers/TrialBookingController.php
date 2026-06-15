<?php

namespace App\Http\Controllers;

use App\Models\TrialBooking;
use App\Models\TimeSlot;
use App\Models\Course;
use App\Models\User;
use App\Models\BookingConflict;
use App\Services\BookingService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class TrialBookingController extends Controller
{
    protected $bookingService;
    protected $auditService;

    public function __construct(BookingService $bookingService, AuditService $auditService)
    {
        $this->bookingService = $bookingService;
        $this->auditService = $auditService;
    }

    public function index(Request $request)
    {
        $query = TrialBooking::with(['course', 'timeSlot', 'assignedTo', 'createdBy'])
            ->withCount('conflicts');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('group')) {
            $query->byGroup($request->group);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('student_name', 'like', "%{$search}%")
                  ->orWhere('parent_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('booking_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('trial_date_from')) {
            $query->where('trial_date', '>=', $request->trial_date_from);
        }

        if ($request->filled('trial_date_to')) {
            $query->where('trial_date', '<=', $request->trial_date_to);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('source_channel')) {
            $query->where('source_channel', $request->source_channel);
        }

        $bookings = $query->orderBy('trial_date', 'desc')
            ->orderBy('time_slot_id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Bookings/Index', [
            'bookings' => $bookings,
            'filters' => $request->all(),
        ]);
    }

    public function create(Request $request)
    {
        $courses = Course::active()->get();
        $timeSlots = TimeSlot::active()->orderBy('start_time')->get();
        $users = User::orderBy('name')->get();

        $selectedDate = $request->input('date', now()->toDateString());
        $selectedTimeSlot = $request->input('time_slot_id');

        $capacityInfo = [];
        if ($selectedDate) {
            $capacityInfo = $this->bookingService->getTimeSlotCapacityInfo($selectedDate);
        }

        $sourceChannels = [
            '线上推广',
            '转介绍',
            '地推活动',
            '自然到访',
            '合作伙伴',
            '其他',
        ];

        return Inertia::render('Bookings/Create', [
            'courses' => $courses,
            'timeSlots' => $timeSlots,
            'users' => $users,
            'sourceChannels' => $sourceChannels,
            'capacityInfo' => $capacityInfo,
            'selectedDate' => $selectedDate,
            'selectedTimeSlot' => $selectedTimeSlot,
        ]);
    }

    public function allCapacityInfo(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $slots = $this->bookingService->getTimeSlotCapacityInfo($request->date);

        return response()->json([
            'slots' => $slots,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_name' => 'required|string|max:100',
            'age' => 'nullable|integer|min:3|max:18',
            'gender' => 'required|in:male,female,unknown',
            'parent_name' => 'nullable|string|max:100',
            'phone' => 'required|string|max:20',
            'source_channel' => 'nullable|string|max:50',
            'source_detail' => 'nullable|string|max:255',
            'course_id' => 'nullable|exists:courses,id',
            'time_slot_id' => 'required|exists:time_slots,id',
            'trial_date' => 'required|date',
            'remark' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        try {
            $booking = $this->bookingService->createBooking($validated);

            $conflicts = $booking->conflicts()->unresolved()->count();

            return redirect()->route('bookings.show', $booking)
                ->with('success', '预约创建成功' . ($conflicts > 0 ? "，检测到 {$conflicts} 个冲突" : ''));
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function show(TrialBooking $booking)
    {
        $booking->load([
            'course',
            'timeSlot',
            'assignedTo',
            'createdBy',
            'reviewedBy',
            'escalatedTo',
            'followUps.createdBy',
            'conflicts.resolvedBy',
            'conflicts.relatedBooking',
        ]);

        $auditLogs = $this->auditService->getLogsForBooking($booking, 100);

        $statusTransitions = $this->getAvailableStatusTransitions($booking);

        $capacityInfo = $this->bookingService->getTimeSlotCapacityInfo(
            $booking->trial_date,
            $booking->time_slot_id
        );

        return Inertia::render('Bookings/Show', [
            'booking' => $booking,
            'auditLogs' => $auditLogs,
            'availableTransitions' => $statusTransitions,
            'capacityInfo' => $capacityInfo[0] ?? null,
        ]);
    }

    public function edit(TrialBooking $booking)
    {
        if ($booking->is_closed) {
            return redirect()->route('bookings.show', $booking)
                ->with('error', '已关闭的预约不能编辑');
        }

        $booking->load(['course', 'timeSlot', 'assignedTo']);

        $courses = Course::active()->get();
        $timeSlots = TimeSlot::active()->orderBy('start_time')->get();
        $users = User::orderBy('name')->get();

        $sourceChannels = [
            '线上推广',
            '转介绍',
            '地推活动',
            '自然到访',
            '合作伙伴',
            '其他',
        ];

        $capacityInfo = $this->bookingService->getTimeSlotCapacityInfo($booking->trial_date);

        return Inertia::render('Bookings/Edit', [
            'booking' => $booking,
            'courses' => $courses,
            'timeSlots' => $timeSlots,
            'users' => $users,
            'sourceChannels' => $sourceChannels,
            'capacityInfo' => $capacityInfo,
        ]);
    }

    public function update(Request $request, TrialBooking $booking)
    {
        if ($booking->is_closed) {
            throw ValidationException::withMessages([
                'error' => '已关闭的预约不能编辑',
            ]);
        }

        $validated = $request->validate([
            'student_name' => 'required|string|max:100',
            'age' => 'nullable|integer|min:3|max:18',
            'gender' => 'required|in:male,female,unknown',
            'parent_name' => 'nullable|string|max:100',
            'phone' => 'required|string|max:20',
            'source_channel' => 'nullable|string|max:50',
            'source_detail' => 'nullable|string|max:255',
            'course_id' => 'nullable|exists:courses,id',
            'time_slot_id' => 'required|exists:time_slots,id',
            'trial_date' => 'required|date',
            'remark' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        try {
            $booking = $this->bookingService->updateBooking($booking, $validated);

            return redirect()->route('bookings.show', $booking)
                ->with('success', '预约更新成功');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function changeStatus(Request $request, TrialBooking $booking)
    {
        $validated = $request->validate([
            'status' => 'required|string',
            'reason' => 'nullable|string',
        ]);

        try {
            $booking = $this->bookingService->changeStatus(
                $booking,
                $validated['status'],
                $validated['reason'] ?? null
            );

            return redirect()->route('bookings.show', $booking)
                ->with('success', '状态更新成功');
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function complete(Request $request, TrialBooking $booking)
    {
        $validated = $request->validate([
            'attended' => 'required|boolean',
            'attendance_note' => 'nullable|string',
        ]);

        try {
            $booking = $this->bookingService->completeBooking(
                $booking,
                $validated['attended'],
                $validated['attendance_note'] ?? null
            );

            return redirect()->route('bookings.show', $booking)
                ->with('success', '预约已完成');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function cancel(Request $request, TrialBooking $booking)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        try {
            $booking = $this->bookingService->cancelBooking(
                $booking,
                $validated['reason'] ?? null
            );

            return redirect()->route('bookings.show', $booking)
                ->with('success', '预约已取消');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function close(TrialBooking $booking)
    {
        try {
            $booking = $this->bookingService->closeBooking($booking);

            return redirect()->route('bookings.show', $booking)
                ->with('success', '预约已关闭');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function escalate(Request $request, TrialBooking $booking)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string',
            'escalated_to' => 'nullable|exists:users,id',
        ]);

        try {
            $booking = $this->bookingService->escalate(
                $booking,
                $validated['reason'] ?? null,
                $validated['escalated_to'] ?? null
            );

            return redirect()->route('bookings.show', $booking)
                ->with('success', '已升级复核');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function review(Request $request, TrialBooking $booking)
    {
        $validated = $request->validate([
            'review_note' => 'nullable|string',
            'review_tags' => 'nullable|array',
            'review_tags.*' => 'string',
        ]);

        try {
            $booking = $this->bookingService->reviewBooking(
                $booking,
                $validated['review_note'] ?? null,
                $validated['review_tags'] ?? null
            );

            return redirect()->route('bookings.show', $booking)
                ->with('success', '复盘已保存');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function addFollowUp(Request $request, TrialBooking $booking)
    {
        $validated = $request->validate([
            'type' => 'required|in:call,wechat,visit,other',
            'content' => 'required|string',
            'follow_up_at' => 'nullable|date',
            'next_follow_up_at' => 'nullable|date',
            'next_action' => 'nullable|string',
            'result' => 'nullable|in:interested,pending,not_interested,need_info,escalated',
            'escalation_reason' => 'nullable|string',
            'escalated_to' => 'nullable|exists:users,id',
        ]);

        try {
            $followUp = $this->bookingService->addFollowUp($booking, $validated);

            return redirect()->route('bookings.show', $booking)
                ->with('success', '跟进记录已添加');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function checkConflicts(Request $request)
    {
        $request->validate([
            'time_slot_id' => 'required|exists:time_slots,id',
            'trial_date' => 'required|date',
            'student_name' => 'nullable|string',
            'phone' => 'nullable|string',
            'booking_id' => 'nullable|exists:trial_bookings,id',
        ]);

        $tempBooking = new TrialBooking();
        $tempBooking->time_slot_id = $request->time_slot_id;
        $tempBooking->trial_date = $request->trial_date;
        $tempBooking->student_name = $request->student_name;
        $tempBooking->phone = $request->phone;
        if ($request->booking_id) {
            $tempBooking->id = $request->booking_id;
            $tempBooking->exists = true;
        }

        $conflicts = $tempBooking->detectConflicts();
        $capacityInfo = $this->bookingService->getTimeSlotCapacityInfo(
            $request->trial_date,
            $request->time_slot_id
        );

        return response()->json([
            'conflicts' => $conflicts,
            'capacity' => $capacityInfo[0] ?? null,
        ]);
    }

    public function capacityInfo(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $slots = $this->bookingService->getTimeSlotCapacityInfo(
            $request->date
        );

        return response()->json([
            'slots' => $slots,
        ]);
    }

    public function resolveConflict(Request $request, TrialBooking $trialBooking, BookingConflict $conflict)
    {
        $validated = $request->validate([
            'resolution_note' => 'required|string',
        ]);

        try {
            $this->bookingService->resolveConflict(
                $conflict,
                $validated['resolution_note']
            );

            return redirect()->route('bookings.show', $trialBooking)
                ->with('success', '冲突已解决');
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function getAvailableStatusTransitions(TrialBooking $booking): array
    {
        $transitions = [];

        $allStatuses = [
            'pending' => '待确认',
            'confirmed' => '已确认',
            'need_info' => '待补资料',
            'escalated' => '升级复核',
            'completed' => '已完成',
            'cancelled' => '已取消',
            'closed' => '已关闭',
        ];

        foreach (array_keys($allStatuses) as $status) {
            if ($booking->canTransitionTo($status)) {
                $transitions[] = [
                    'status' => $status,
                    'label' => $allStatuses[$status],
                ];
            }
        }

        return $transitions;
    }
}
