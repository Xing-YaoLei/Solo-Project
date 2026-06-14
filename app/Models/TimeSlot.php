<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TimeSlot extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'default_capacity',
        'day_of_week',
        'is_active',
        'remark',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function bookings(): HasMany
    {
        return $this->hasMany(TrialBooking::class);
    }

    public function capacityRules(): HasMany
    {
        return $this->hasMany(CapacityRule::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForDayOfWeek($query, $dayOfWeek)
    {
        return $query->where(function ($q) use ($dayOfWeek) {
            $q->whereNull('day_of_week')
              ->orWhere('day_of_week', $dayOfWeek);
        });
    }

    public function getCapacityForDate($date): int
    {
        $date = is_string($date) ? new \Carbon\Carbon($date) : $date;
        $dayOfWeek = $date->dayOfWeek;

        $rule = $this->capacityRules()
            ->where('is_active', true)
            ->where(function ($query) use ($date, $dayOfWeek) {
                $query->where('apply_date', $date->toDateString())
                      ->orWhere(function ($q) use ($dayOfWeek) {
                          $q->whereNull('apply_date')
                            ->where('day_of_week', $dayOfWeek);
                      });
            })
            ->orderByRaw("CASE WHEN apply_date IS NOT NULL THEN 0 ELSE 1 END")
            ->first();

        return $rule ? $rule->max_capacity : $this->default_capacity;
    }
}
