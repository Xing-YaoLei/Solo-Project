<?php

namespace App\Models;

use App\Traits\HasAttachments;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreparationItem extends Model
{
    use HasAttachments;

    const STATUS_PENDING = 'pending';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    const STATUS_LABELS = [
        self::STATUS_PENDING => '待处理',
        self::STATUS_IN_PROGRESS => '处理中',
        self::STATUS_COMPLETED => '已完成',
        self::STATUS_CANCELLED => '已取消',
    ];

    const CATEGORY_LABELS = [
        'exterior' => '外观',
        'interior' => '内饰',
        'mechanical' => '机械',
        'electrical' => '电器',
        'other' => '其他',
    ];

    protected $fillable = [
        'vehicle_id', 'category', 'name', 'description', 'estimated_cost',
        'actual_cost', 'status', 'completed_at', 'handled_by', 'resolution',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'estimated_cost' => 'decimal:2',
            'actual_cost' => 'decimal:2',
        ];
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function categoryLabel(): string
    {
        return self::CATEGORY_LABELS[$this->category] ?? $this->category;
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
