<?php

namespace App\Jobs;

use App\Models\TrialBooking;
use App\Services\AuditService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class DetectBookingConflicts implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $booking;
    public $uniqueFor = 30;

    public function __construct(TrialBooking $booking)
    {
        $this->booking = $booking;
    }

    public function handle(AuditService $auditService): void
    {
        $booking = $this->booking->fresh();
        if (!$booking || $booking->status === TrialBooking::STATUS_CANCELLED || $booking->status === TrialBooking::STATUS_CLOSED) {
            return;
        }

        $conflicts = $booking->detectConflicts();

        foreach ($conflicts as $conflict) {
            $existingConflict = $booking->conflicts()
                ->where('conflict_type', $conflict['type'])
                ->where('resolved', false)
                ->first();

            if (!$existingConflict) {
                $bookingConflict = $booking->conflicts()->create([
                    'conflict_type' => $conflict['type'],
                    'conflict_description' => $conflict['description'],
                    'conflict_data' => $conflict['data'] ?? null,
                    'related_booking_id' => $conflict['related_booking_id'] ?? null,
                    'created_by' => $booking->created_by,
                ]);

                $auditService->logConflictDetected(
                    $booking,
                    $bookingConflict->id,
                    $conflict['type'],
                    $conflict['description']
                );
            }
        }

        Log::info('预约冲突检测完成', [
            'booking_id' => $booking->id,
            'booking_no' => $booking->booking_no,
            'conflict_count' => count($conflicts),
        ]);
    }

    public function uniqueId(): string
    {
        return 'detect-conflicts-' . $this->booking->id;
    }
}
