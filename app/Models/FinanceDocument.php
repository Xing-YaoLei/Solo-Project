<?php

namespace App\Models;

use App\Traits\HasAttachments;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceDocument extends Model
{
    use HasAttachments;

    const TYPE_LABELS = [
        'registration' => '行驶证',
        'vehicle_cert' => '车辆登记证',
        'purchase_invoice' => '购车发票',
        'insurance' => '保险单',
        'inspection_report' => '检测报告',
        'maintenance_record' => '保养记录',
        'other' => '其他资料',
    ];

    const STATUS_LABELS = [
        'received' => '已收到',
        'verified' => '已核验',
        'missing' => '资料缺失',
        'expired' => '已过期',
    ];

    protected $fillable = [
        'vehicle_id', 'type', 'title', 'reference_no', 'issue_date', 'expire_date',
        'status', 'verification_notes', 'verified_by', 'verified_at', 'handled_by',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'expire_date' => 'date',
            'verified_at' => 'datetime',
        ];
    }

    public function typeLabel(): string
    {
        return self::TYPE_LABELS[$this->type] ?? $this->type;
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
