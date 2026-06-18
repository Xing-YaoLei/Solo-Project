<?php

namespace App\Providers;

use App\Models\Anomaly;
use App\Models\Attachment;
use App\Models\FinanceDocument;
use App\Models\PreparationItem;
use App\Models\QuoteHistory;
use App\Models\TestDrive;
use App\Models\Vehicle;
use App\Policies\AnomalyPolicy;
use App\Policies\AttachmentPolicy;
use App\Policies\FinanceDocumentPolicy;
use App\Policies\PreparationItemPolicy;
use App\Policies\QuoteHistoryPolicy;
use App\Policies\StatisticsPolicy;
use App\Policies\TestDrivePolicy;
use App\Policies\VehiclePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Vehicle::class => VehiclePolicy::class,
        PreparationItem::class => PreparationItemPolicy::class,
        TestDrive::class => TestDrivePolicy::class,
        QuoteHistory::class => QuoteHistoryPolicy::class,
        FinanceDocument::class => FinanceDocumentPolicy::class,
        Anomaly::class => AnomalyPolicy::class,
        Attachment::class => AttachmentPolicy::class,
        StatisticsPolicy::class => StatisticsPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
