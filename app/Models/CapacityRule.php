<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CapacityRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'rule_type',
        'time_slot_id',
        'apply_date',
        'day_of_week',
        'max_capacity',
        'warn_capacity',
        'is_active',
        'remark',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForDate($query, $date)
    {
        $date = is_string($date) ? new \Carbon\Carbon($date) : $date;
        $dayOfWeek = $date->dayOfWeek;

        return $query->where(function ($q) use ($date, $dayOfWeek) {
            $q->where('apply_date', $date->toDateString())
              ->orWhere(function ($subQ) use ($dayOfWeek) {
                  $subQ->whereNull('apply_date')
                      ->where('day_of_week', $dayOfWeek);
              });
        });
    }
}
