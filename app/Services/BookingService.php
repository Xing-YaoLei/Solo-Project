<?php

namespace App\Services;

use App\Models\TrialBooking;
use App\Models\BookingConflict;
use App\Models\BookingFollowUp;
use App\Models\TimeSlot;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class BookingService
{
    protected $auditService;

    public function __construct(AuditService $auditService)
    {
        $this->auditService = $auditService;
    }

    public function createBooking(array $data): TrialBooking
    {
        return DB::transaction(function () use ($data) {
            $data['created_by'] = Auth::id();
            if (!isset($data['status'])) {
                $data['status'] = TrialBooking::STATUS_PENDING;
            }

            $booking = TrialBooking::create($data);

            $this->auditService->logBookingCreation($booking, $data);

            $conflicts = $booking->detectConflicts();
            foreach ($conflicts as $conflict) {
                $this->createConflictRecord($booking, $conflict);
            }

            $booking->load(['course', 'timeSlot', 'assignedTo', 'createdBy']);

            return $booking;
        });
    }

    public function updateBooking(TrialBooking $booking, array $data): TrialBooking
    {
        return DB::transaction(function () use ($booking, $data) {
            $oldValues = $booking->only(array_keys($data));

            $booking->update($data);

            $changedValues = [];
            foreach ($data as $key => $value) {
                if ($oldValues[$key] != $value) {
                    $changedValues[$key] = $value;
                }
            }

            if (!empty($changedValues)) {
                $this->auditService->logBookingUpdate($booking, $oldValues, $changedValues);
            }

            if ($booking->wasChanged(['time_slot_id', 'trial_date', 'student_name', 'phone'])) {
                $booking->conflicts()->update(['resolved' => false]);
                $conflicts = $booking->detectConflicts();
                foreach ($conflicts as $conflict) {
                    $this->createConflictRecord($booking, $conflict);
                }
            }

            $booking->load(['course', 'timeSlot', 'assignedTo', 'createdBy']);

            return $booking;
        });
    }

    public function changeStatus(TrialBooking $booking, string $newStatus, ?string $reason = null): TrialBooking
    {
        if (!$booking->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException("无法从 {$booking->status} 状态变更为 {$newStatus}");
        }

        return DB::transaction(function () use ($booking, $newStatus, $reason) {
            $oldStatus = $booking->status;
            $booking->status = $newStatus;
            $booking->updated_by = Auth::id();
            $booking->save();

            $this->auditService->logStatusChange($booking, $oldStatus, $newStatus, $reason);

            return $booking->fresh();
        });
    }

    public function addFollowUp(TrialBooking $booking, array $data): BookingFollowUp
    {
        return DB::transaction(function () use ($booking, $data) {
            $followUp = new BookingFollowUp();
            $followUp->booking_id = $booking->id;
            $followUp->type = $data['type'] ?? 'call';
            $followUp->content = $data['content'];
            $followUp->follow_up_at = $data['follow_up_at'] ?? now();
            $followUp->next_follow_up_at = $data['next_follow_up_at'] ?? null;
            $followUp->next_action = $data['next_action'] ?? null;
            $followUp->result = $data['result'] ?? null;
            $followUp->created_by = Auth::id();
            $followUp->save();

            $this->auditService->logFollowUpAdded($booking, $followUp->id, $data['content']);

            if (!empty($data['result']) && $data['result'] === 'need_info') {
                $this->changeStatus($booking, TrialBooking::STATUS_NEED_INFO, '跟进后需补资料');
            }

            if (!empty($data['result']) && $data['result'] === 'escalated') {
                $this->escalate(
                    $booking,
                    $data['escalation_reason'] ?? null,
                    isset($data['escalated_to']) ? (int)$data['escalated_to'] : null
                );
            }

            $followUp->load('createdBy');

            return $followUp;
        });
    }

    public function escalate(TrialBooking $booking, ?string $reason = null, ?int $escalatedTo = null): TrialBooking
    {
        return DB::transaction(function () use ($booking, $reason, $escalatedTo) {
            $booking->escalated_to = $escalatedTo;
            $booking->escalation_reason = $reason;
            $booking->escalated_at = now();
            $booking->status = TrialBooking::STATUS_ESCALATED;
            $booking->save();

            $this->auditService->logEscalation($booking, $reason);

            $booking->load('escalatedTo');

            return $booking;
        });
    }

    public function completeBooking(TrialBooking $booking, bool $attended, ?string $note = null): TrialBooking
    {
        return DB::transaction(function () use ($booking, $attended, $note) {
            $booking->attended = $attended;
            $booking->attendance_note = $note;
            $booking->status = TrialBooking::STATUS_COMPLETED;
            $booking->save();

            $this->auditService->logBookingCompletion($booking, $attended, $note);

            return $booking->fresh();
        });
    }

    public function cancelBooking(TrialBooking $booking, ?string $reason = null): TrialBooking
    {
        return DB::transaction(function () use ($booking, $reason) {
            $booking->status = TrialBooking::STATUS_CANCELLED;
            if ($reason) {
                if ($booking->remark) {
                    $booking->remark = $booking->remark . "\n取消原因: " . $reason;
                } else {
                    $booking->remark = "取消原因: " . $reason;
                }
            }
            $booking->save();

            $this->auditService->logBookingCancellation($booking, $reason);

            return $booking->fresh();
        });
    }

    public function closeBooking(TrialBooking $booking): TrialBooking
    {
        return DB::transaction(function () use ($booking) {
            $booking->status = TrialBooking::STATUS_CLOSED;
            $booking->save();

            $this->auditService->logBookingClosed($booking);

            return $booking->fresh();
        });
    }

    public function reviewBooking(TrialBooking $booking, ?string $note = null, ?array $tags = null): TrialBooking
    {
        return DB::transaction(function () use ($booking, $note, $tags) {
            $booking->review_note = $note;
            $booking->review_tags = $tags;
            $booking->reviewed_by = Auth::id();
            $booking->reviewed_at = now();
            $booking->save();

            $this->auditService->logReview($booking, $note, $tags);

            $booking->load('reviewedBy');

            return $booking;
        });
    }

    protected function createConflictRecord(TrialBooking $booking, array $conflictData): BookingConflict
    {
        $conflict = new BookingConflict();
        $conflict->booking_id = $booking->id;
        $conflict->conflict_type = $conflictData['type'];
        $conflict->conflict_description = $conflictData['description'];
        $conflict->conflict_data = $conflictData['data'] ?? null;
        $conflict->related_booking_id = $conflictData['related_booking_id'] ?? null;
        $conflict->created_by = Auth::id();
        $conflict->save();

        $this->auditService->logConflictDetected(
            $booking,
            $conflict->id,
            $conflictData['type'],
            $conflictData['description']
        );

        return $conflict;
    }

    public function resolveConflict(BookingConflict $conflict, string $resolutionNote): BookingConflict
    {
        return DB::transaction(function () use ($conflict, $resolutionNote) {
            $conflict->resolved = true;
            $conflict->resolution_note = $resolutionNote;
            $conflict->resolved_by = Auth::id();
            $conflict->resolved_at = now();
            $conflict->save();

            if ($conflict->booking) {
                $this->auditService->logConflictResolved(
                    $conflict->booking,
                    $conflict->id,
                    $resolutionNote
                );
            }

            $conflict->load('resolvedBy');

            return $conflict;
        });
    }

    public function getTimeSlotCapacityInfo($date, ?int $timeSlotId = null): array
    {
        $query = TimeSlot::active();

        if ($timeSlotId) {
            $query->where('id', $timeSlotId);
        }

        $timeSlots = $query->get();

        $result = [];
        foreach ($timeSlots as $slot) {
            $maxCapacity = $slot->getCapacityForDate($date);

            $bookedCount = TrialBooking::where('time_slot_id', $slot->id)
                ->where('trial_date', $date)
                ->whereNotIn('status', [
                    TrialBooking::STATUS_CANCELLED,
                    TrialBooking::STATUS_CLOSED,
                ])
                ->count();

            $warnCapacity = $slot->capacityRules()
                ->where('is_active', true)
                ->value('warn_capacity') ?? 0;

            $result[] = [
                'id' => $slot->id,
                'name' => $slot->name,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'max_capacity' => $maxCapacity,
                'warn_capacity' => $warnCapacity,
                'booked_count' => $bookedCount,
                'available_count' => max(0, $maxCapacity - $bookedCount),
                'is_full' => $bookedCount >= $maxCapacity,
                'is_warning' => $warnCapacity > 0 && $bookedCount >= $warnCapacity,
            ];
        }

        return $result;
    }

    public function getCalendarData(string $startDate, string $endDate, array $filters = []): array
    {
        $bookings = TrialBooking::with(['timeSlot', 'course', 'assignedTo'])
            ->whereBetween('trial_date', [$startDate, $endDate])
            ->when(!empty($filters['status']), function ($q) use ($filters) {
                $q->where('status', $filters['status']);
            })
            ->when(!empty($filters['assigned_to']), function ($q) use ($filters) {
                $q->where('assigned_to', $filters['assigned_to']);
            })
            ->when(!empty($filters['source_channel']), function ($q) use ($filters) {
                $q->where('source_channel', $filters['source_channel']);
            })
            ->orderBy('trial_date')
            ->orderBy('time_slot_id')
            ->get();

        $grouped = [];
        foreach ($bookings as $booking) {
            $date = $booking->trial_date->toDateString();
            if (!isset($grouped[$date])) {
                $grouped[$date] = [];
            }
            $grouped[$date][] = $booking;
        }

        return $grouped;
    }
}
