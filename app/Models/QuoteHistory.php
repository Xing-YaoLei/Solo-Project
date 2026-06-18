<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuoteHistory extends Model
{
    const STAGE_INITIAL = 'initial';
    const STAGE_NEGOTIATION = 'negotiation';
    const STAGE_FINAL = 'final';

    const STAGE_LABELS = [
        self::STAGE_INITIAL => '初次报价',
        self::STAGE_NEGOTIATION => '议价中',
        self::STAGE_FINAL => '最终报价',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_COUNTERED = 'countered';

    const STATUS_LABELS = [
        self::STATUS_PENDING => '待确认',
        self::STATUS_ACCEPTED => '已接受',
        self::STATUS_REJECTED => '已拒绝',
        self::STATUS_COUNTERED => '已还价',
    ];

    protected $fillable = [
        'vehicle_id', 'quote_price', 'counter_offer', 'final_price', 'stage',
        'negotiation_notes', 'status', 'responded_at', 'quoted_by', 'approved_by', 'remark',
    ];

    protected function casts(): array
    {
        return [
            'quote_price' => 'decimal:2',
            'counter_offer' => 'decimal:2',
            'final_price' => 'decimal:2',
            'responded_at' => 'datetime',
        ];
    }

    public function stageLabel(): string
    {
        return self::STAGE_LABELS[$this->stage] ?? $this->stage;
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function quoter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'quoted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
