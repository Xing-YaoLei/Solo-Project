<?php

namespace App\Models;

use App\Traits\HasAttachments;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Anomaly extends Model
{
    use HasAttachments;

    const STATUS_OPEN = 'open';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_ESCALATED = 'escalated';
    const STATUS_CLOSED = 'closed';

    const STATUS_LABELS = [
        self::STATUS_OPEN => '待处理',
        self::STATUS_IN_PROGRESS => '处理中',
        self::STATUS_RESOLVED => '已解决',
        self::STATUS_ESCALATED => '已升级',
        self::STATUS_CLOSED => '已关闭',
    ];

    const SEVERITY_LABELS = [
        'low' => '低',
        'normal' => '中',
        'high' => '高',
        'critical' => '严重',
    ];

    const TYPE_LABELS = [
        'missing_doc' => '资料缺失',
        'damage_dispute' => '车况争议',
        'price_dispute' => '价格争议',
        'legal_risk' => '法律风险',
        'other' => '其他异常',
    ];

    const SOURCE_LABELS = [
        'system' => '系统',
        'appraiser' => '评估师',
        'sales' => '销售',
        'finance' => '金融',
        'manager' => '店长',
        'customer' => '客户',
    ];

    protected $fillable = [
        'vehicle_id', 'type', 'title', 'description', 'severity', 'status',
        'resolution', 'conclusion', 'source', 'resolved_at', 'reported_by',
        'handled_by', 'approved_by', 'before_snapshot', 'after_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
            'before_snapshot' => 'json',
            'after_snapshot' => 'json',
        ];
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function severityLabel(): string
    {
        return self::SEVERITY_LABELS[$this->severity] ?? $this->severity;
    }

    public function typeLabel(): string
    {
        return self::TYPE_LABELS[$this->type] ?? $this->type;
    }

    public function sourceLabel(): string
    {
        return self::SOURCE_LABELS[$this->source] ?? $this->source;
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function history(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'loggable_id')->where('loggable_type', Anomaly::class)->latest();
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_OPEN, self::STATUS_IN_PROGRESS, self::STATUS_ESCALATED]);
    }
}
