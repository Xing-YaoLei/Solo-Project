<?php

namespace App\Services;

use App\Models\TrialBooking;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    public function getOverviewStats(string $startDate, string $endDate): array
    {
        $bookings = TrialBooking::whereBetween('trial_date', [$startDate, $endDate])
            ->where('status', '!=', TrialBooking::STATUS_CANCELLED)
            ->get();

        $totalBookings = $bookings->count();

        $attendedCount = $bookings->where('attended', true)->count();
        $notAttendedCount = $bookings->where('attended', false)->count();

        $attendanceRate = $totalBookings > 0 ? round($attendedCount / $totalBookings * 100, 2) : 0;

        $pendingCount = $bookings->where('status', TrialBooking::STATUS_PENDING)->count();
        $confirmedCount = $bookings->where('status', TrialBooking::STATUS_CONFIRMED)->count();
        $completedCount = $bookings->where('status', TrialBooking::STATUS_COMPLETED)->count();
        $needInfoCount = $bookings->where('status', TrialBooking::STATUS_NEED_INFO)->count();
        $escalatedCount = $bookings->where('status', TrialBooking::STATUS_ESCALATED)->count();

        return [
            'total_bookings' => $totalBookings,
            'attended_count' => $attendedCount,
            'not_attended_count' => $notAttendedCount,
            'attendance_rate' => $attendanceRate,
            'pending_count' => $pendingCount,
            'confirmed_count' => $confirmedCount,
            'completed_count' => $completedCount,
            'need_info_count' => $needInfoCount,
            'escalated_count' => $escalatedCount,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ];
    }

    public function getAttendanceRateByDate(string $startDate, string $endDate): array
    {
        $results = TrialBooking::select(
            'trial_date',
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as attended'),
            DB::raw('SUM(CASE WHEN attended = 0 THEN 1 ELSE 0 END) as not_attended')
        )
            ->whereBetween('trial_date', [$startDate, $endDate])
            ->whereIn('status', [TrialBooking::STATUS_COMPLETED, TrialBooking::STATUS_CLOSED])
            ->groupBy('trial_date')
            ->orderBy('trial_date')
            ->get();

        return $results->map(function ($item) {
            return [
                'date' => $item->trial_date,
                'total' => $item->total,
                'attended' => $item->attended,
                'not_attended' => $item->not_attended,
                'attendance_rate' => $item->total > 0 ? round($item->attended / $item->total * 100, 2) : 0,
            ];
        })->toArray();
    }

    public function getBySourceChannel(string $startDate, string $endDate): array
    {
        $results = TrialBooking::select(
            'source_channel',
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as attended'),
            DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
            DB::raw('SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled')
        )
            ->whereBetween('trial_date', [$startDate, $endDate])
            ->groupBy('source_channel')
            ->orderBy('total', 'desc')
            ->get();

        return $results->map(function ($item) {
            return [
                'channel' => $item->source_channel ?? '未填写',
                'total' => $item->total,
                'attended' => $item->attended,
                'completed' => $item->completed,
                'cancelled' => $item->cancelled,
                'attendance_rate' => $item->total > 0 ? round($item->attended / $item->total * 100, 2) : 0,
                'conversion_rate' => $item->total > 0 ? round($item->completed / $item->total * 100, 2) : 0,
            ];
        })->toArray();
    }

    public function getByAssignee(string $startDate, string $endDate): array
    {
        $results = TrialBooking::with('assignedTo')
            ->select(
                'assigned_to',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as attended'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
                DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending'),
                DB::raw('SUM(CASE WHEN status = "escalated" THEN 1 ELSE 0 END) as escalated')
            )
            ->whereBetween('trial_date', [$startDate, $endDate])
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->orderBy('total', 'desc')
            ->get();

        return $results->map(function ($item) {
            return [
                'user_id' => $item->assigned_to,
                'user_name' => $item->assignedTo?->name ?? '未知',
                'total' => $item->total,
                'attended' => $item->attended,
                'completed' => $item->completed,
                'pending' => $item->pending,
                'escalated' => $item->escalated,
                'attendance_rate' => $item->total > 0 ? round($item->attended / $item->total * 100, 2) : 0,
                'completion_rate' => $item->total > 0 ? round($item->completed / $item->total * 100, 2) : 0,
                'escalation_rate' => $item->total > 0 ? round($item->escalated / $item->total * 100, 2) : 0,
            ];
        })->toArray();
    }

    public function getReviewTags(string $startDate, string $endDate): array
    {
        $bookings = TrialBooking::whereBetween('trial_date', [$startDate, $endDate])
            ->whereNotNull('review_tags')
            ->where('review_tags', '!=', '[]')
            ->where('review_tags', '!=', 'null')
            ->get();

        $tagCounts = [];

        foreach ($bookings as $booking) {
            $tags = $booking->review_tags;
            if (is_array($tags)) {
                foreach ($tags as $tag) {
                    if (!isset($tagCounts[$tag])) {
                        $tagCounts[$tag] = [
                            'tag' => $tag,
                            'count' => 0,
                            'attended_count' => 0,
                        ];
                    }
                    $tagCounts[$tag]['count']++;
                    if ($booking->attended) {
                        $tagCounts[$tag]['attended_count']++;
                    }
                }
            }
        }

        usort($tagCounts, function ($a, $b) {
            return $b['count'] - $a['count'];
        });

        return $tagCounts;
    }

    public function getByTimeSlot(string $startDate, string $endDate): array
    {
        $results = TrialBooking::with('timeSlot')
            ->select(
                'time_slot_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as attended'),
                DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
            )
            ->whereBetween('trial_date', [$startDate, $endDate])
            ->groupBy('time_slot_id')
            ->orderBy('total', 'desc')
            ->get();

        return $results->map(function ($item) {
            return [
                'time_slot_id' => $item->time_slot_id,
                'time_slot_name' => $item->timeSlot?->name ?? '未知',
                'time_range' => $item->timeSlot ? "{$item->timeSlot->start_time} - {$item->timeSlot->end_time}" : '',
                'total' => $item->total,
                'attended' => $item->attended,
                'completed' => $item->completed,
                'attendance_rate' => $item->total > 0 ? round($item->attended / $item->total * 100, 2) : 0,
            ];
        })->toArray();
    }

    public function getDailyTrend(string $startDate, string $endDate): array
    {
        $results = TrialBooking::select(
            'trial_date',
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending'),
            DB::raw('SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed'),
            DB::raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
            DB::raw('SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled'),
            DB::raw('SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as attended')
        )
            ->whereBetween('trial_date', [$startDate, $endDate])
            ->groupBy('trial_date')
            ->orderBy('trial_date')
            ->get();

        return $results->map(function ($item) {
            return [
                'date' => $item->trial_date,
                'total' => $item->total,
                'pending' => $item->pending,
                'confirmed' => $item->confirmed,
                'completed' => $item->completed,
                'cancelled' => $item->cancelled,
                'attended' => $item->attended,
                'attendance_rate' => $item->completed > 0 ? round($item->attended / $item->completed * 100, 2) : 0,
            ];
        })->toArray();
    }
}
