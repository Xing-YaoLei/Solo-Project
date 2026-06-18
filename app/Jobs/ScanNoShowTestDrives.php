<?php

namespace App\Jobs;

use App\Enums\TestDriveStatus;
use App\Enums\TimelineCategory;
use App\Models\TestDrive;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScanNoShowTestDrives implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $threshold = now()->addMinutes(-60);

        $noShows = TestDrive::whereIn('status', [TestDriveStatus::PENDING->value, TestDriveStatus::CONFIRMED->value])
            ->where('appointment_end_at', '<=', $threshold)
            ->where('is_no_show', false)
            ->whereNull('actual_start_at')
            ->get();

        foreach ($noShows as $td) {
            $td->is_no_show = true;
            $td->no_show_reason = 0;
            $td->status = TestDriveStatus::NO_SHOW;
            $td->save();

            $td->addTimeline(
                TimelineCategory::RESPONSIBILITY,
                9,
                '系统自动检测为爽约',
                '预约结束后1小时内未产生实际开始记录，系统自动标记爽约，请相关人员核实',
                'auto_no_show_scan', null, true
            );

            Log::info('Auto no-show detected', ['test_drive_id' => $td->id, 'code' => $td->code]);
        }
    }
}
