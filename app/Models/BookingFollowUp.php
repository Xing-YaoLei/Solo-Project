<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BookingFollowUp extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'booking_id',
        'type',
        'content',
        'follow_up_at',
        'next_follow_up_at',
        'next_action',
        'result',
        'created_by',
    ];

    protected $casts = [
        'follow_up_at' => 'datetime',
        'next_follow_up_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(TrialBooking::class, 'booking_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getTypeLabelAttribute(): string
    {
        $labels = [
            'call' => '电话',
            'wechat' => '微信',
            'visit' => '到访',
            'other' => '其他',
        ];

        return $labels[$this->type] ?? $this->type;
    }

    public function getResultLabelAttribute(): string
    {
        $labels = [
            'interested' => '有意向',
            'pending' => '待定',
            'not_interested' => '无意向',
            'need_info' => '需补资料',
            'escalated' => '需升级',
        ];

        return $labels[$this->result] ?? $this->result ?? '-';
    }
}
