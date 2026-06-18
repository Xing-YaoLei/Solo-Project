<?php

namespace App\Models;

use App\Traits\HasAttachments;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestDrive extends Model
{
    use HasAttachments;

    protected $fillable = [
        'vehicle_id', 'drive_at', 'driver_name', 'driver_phone', 'start_mileage',
        'end_mileage', 'duration_minutes', 'route', 'performance', 'brake_condition',
        'steering_condition', 'abnormal_noise', 'other_issues', 'rating',
        'overall_evaluation', 'accompanied_by',
    ];

    protected function casts(): array
    {
        return [
            'drive_at' => 'datetime',
        ];
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function accompanier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accompanied_by');
    }

    public function getActualMileageAttribute(): ?int
    {
        if ($this->end_mileage && $this->start_mileage) {
            return $this->end_mileage - $this->start_mileage;
        }
        return null;
    }
}
