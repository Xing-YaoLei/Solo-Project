<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'action',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'description',
        'user_id',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(TrialBooking::class, 'booking_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForBooking($query, $bookingId)
    {
        return $query->where('booking_id', $bookingId)
            ->orWhere(function ($q) use ($bookingId) {
                $q->where('model_type', TrialBooking::class)
                  ->where('model_id', $bookingId);
            });
    }

    public function getActionLabelAttribute(): string
    {
        $labels = [
            'created' => '创建',
            'updated' => '更新',
            'deleted' => '删除',
            'restored' => '恢复',
            'status_changed' => '状态变更',
            'follow_up_added' => '添加跟进',
            'conflict_detected' => '检测到冲突',
            'conflict_resolved' => '解决冲突',
            'escalated' => '升级复核',
            'reviewed' => '复盘',
            'completed' => '完成',
            'cancelled' => '取消',
            'closed' => '关闭',
        ];

        return $labels[$this->action] ?? $this->action;
    }

    public function getDetailsAttribute(): ?array
    {
        $details = [];

        if ($this->old_values) {
            $details['old'] = $this->old_values;
        }
        if ($this->new_values) {
            $details['new'] = $this->new_values;
        }

        return !empty($details) ? $details : null;
    }
}
