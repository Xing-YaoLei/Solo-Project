<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\TrialBooking;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public function log(
        string $action,
        ?TrialBooking $booking = null,
        ?string $modelType = null,
        ?int $modelId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): AuditLog {
        $log = new AuditLog();
        $log->action = $action;
        $log->booking_id = $booking?->id;
        $log->model_type = $modelType;
        $log->model_id = $modelId;
        $log->old_values = $oldValues;
        $log->new_values = $newValues;
        $log->description = $description;
        $log->user_id = Auth::id();
        $log->ip_address = Request::ip();
        $log->user_agent = Request::userAgent();
        $log->save();

        return $log;
    }

    public function logBookingCreation(TrialBooking $booking, array $data): AuditLog
    {
        return $this->log(
            action: 'created',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            newValues: $data,
            description: '创建试听预约'
        );
    }

    public function logBookingUpdate(TrialBooking $booking, array $oldValues, array $newValues): AuditLog
    {
        return $this->log(
            action: 'updated',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            oldValues: $oldValues,
            newValues: $newValues,
            description: '更新试听预约信息'
        );
    }

    public function logStatusChange(TrialBooking $booking, string $oldStatus, string $newStatus, ?string $reason = null): AuditLog
    {
        return $this->log(
            action: 'status_changed',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => $newStatus],
            description: $reason ? "状态变更: {$oldStatus} -> {$newStatus}，原因: {$reason}" : "状态变更: {$oldStatus} -> {$newStatus}"
        );
    }

    public function logFollowUpAdded(TrialBooking $booking, int $followUpId, string $content): AuditLog
    {
        return $this->log(
            action: 'follow_up_added',
            booking: $booking,
            modelType: \App\Models\BookingFollowUp::class,
            modelId: $followUpId,
            newValues: ['content' => $content],
            description: '添加跟进记录'
        );
    }

    public function logConflictDetected(TrialBooking $booking, int $conflictId, string $conflictType, string $description): AuditLog
    {
        return $this->log(
            action: 'conflict_detected',
            booking: $booking,
            modelType: \App\Models\BookingConflict::class,
            modelId: $conflictId,
            newValues: ['conflict_type' => $conflictType, 'description' => $description],
            description: "检测到冲突: {$conflictType}"
        );
    }

    public function logConflictResolved(TrialBooking $booking, int $conflictId, string $resolution): AuditLog
    {
        return $this->log(
            action: 'conflict_resolved',
            booking: $booking,
            modelType: \App\Models\BookingConflict::class,
            modelId: $conflictId,
            newValues: ['resolution' => $resolution],
            description: '冲突已解决'
        );
    }

    public function logEscalation(TrialBooking $booking, ?string $reason = null): AuditLog
    {
        return $this->log(
            action: 'escalated',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            newValues: ['escalation_reason' => $reason],
            description: $reason ? "升级复核: {$reason}" : '升级复核'
        );
    }

    public function logReview(TrialBooking $booking, ?string $note = null, ?array $tags = null): AuditLog
    {
        return $this->log(
            action: 'reviewed',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            newValues: ['review_note' => $note, 'review_tags' => $tags],
            description: '完成复盘'
        );
    }

    public function logBookingCompletion(TrialBooking $booking, bool $attended, ?string $note = null): AuditLog
    {
        return $this->log(
            action: 'completed',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            newValues: ['attended' => $attended, 'attendance_note' => $note],
            description: $attended ? '预约完成 - 已到场' : '预约完成 - 未到场'
        );
    }

    public function logBookingCancellation(TrialBooking $booking, ?string $reason = null): AuditLog
    {
        return $this->log(
            action: 'cancelled',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            newValues: ['reason' => $reason],
            description: $reason ? "取消预约: {$reason}" : '取消预约'
        );
    }

    public function logBookingClosed(TrialBooking $booking): AuditLog
    {
        return $this->log(
            action: 'closed',
            booking: $booking,
            modelType: TrialBooking::class,
            modelId: $booking->id,
            description: '关闭预约记录'
        );
    }

    public function getLogsForBooking(TrialBooking $booking, int $limit = 50)
    {
        return AuditLog::forBooking($booking->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
