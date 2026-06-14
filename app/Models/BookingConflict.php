<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingConflict extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'conflict_type',
        'conflict_description',
        'conflict_data',
        'related_booking_id',
        'resolved',
        'resolution_note',
        'resolved_by',
        'resolved_at',
        'created_by',
    ];

    protected $casts = [
        'conflict_data' => 'array',
        'resolved' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(TrialBooking::class, 'booking_id');
    }

    public function relatedBooking(): BelongsTo
    {
        return $this->belongsTo(TrialBooking::class, 'related_booking_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getConflictTypeLabelAttribute(): string
    {
        $labels = [
            'capacity_full' => '容量已满',
            'time_overlap' => '时间重叠',
            'student_duplicate' => '学员重复',
            'phone_duplicate' => '手机号重复',
            'other' => '其他冲突',
        ];

        return $labels[$this->conflict_type] ?? $this->conflict_type;
    }

    public function scopeUnresolved($query)
    {
        return $query->where('resolved', false);
    }

    public function scopeResolved($query)
    {
        return $query->where('resolved', true);
    }
}
