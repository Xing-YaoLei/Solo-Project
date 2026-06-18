<?php

namespace App\Models;

use App\Traits\HasAttachments;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use SoftDeletes, HasAttachments, LogsActivity;

    const STATUS_PENDING = 'pending';
    const STATUS_PREPARING = 'preparing';
    const STATUS_AVAILABLE = 'available';
    const STATUS_SOLD = 'sold';
    const STATUS_CANCELLED = 'cancelled';

    const STATUS_LABELS = [
        self::STATUS_PENDING => '评估中',
        self::STATUS_PREPARING => '整备中',
        self::STATUS_AVAILABLE => '在库',
        self::STATUS_SOLD => '已售',
        self::STATUS_CANCELLED => '已取消',
    ];

    protected $fillable = [
        'vin', 'plate_no', 'brand', 'model', 'year', 'color', 'mileage',
        'first_register_date', 'displacement', 'transmission', 'fuel_type',
        'purchase_price', 'expected_sale_price', 'actual_sale_price', 'status',
        'source', 'owner_name', 'owner_phone', 'remark', 'appraiser_id',
        'sales_id', 'created_by', 'arrival_date', 'sold_date',
    ];

    protected function casts(): array
    {
        return [
            'first_register_date' => 'date',
            'arrival_date' => 'date',
            'sold_date' => 'date',
            'purchase_price' => 'decimal:2',
            'expected_sale_price' => 'decimal:2',
            'actual_sale_price' => 'decimal:2',
        ];
    }

    public function statusLabel(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function appraiser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'appraiser_id');
    }

    public function sales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function preparationItems(): HasMany
    {
        return $this->hasMany(PreparationItem::class);
    }

    public function testDrives(): HasMany
    {
        return $this->hasMany(TestDrive::class)->latest();
    }

    public function quoteHistories(): HasMany
    {
        return $this->hasMany(QuoteHistory::class)->latest();
    }

    public function financeDocuments(): HasMany
    {
        return $this->hasMany(FinanceDocument::class);
    }

    public function anomalies(): HasMany
    {
        return $this->hasMany(Anomaly::class)->latest();
    }

    public function activeAnomalies(): HasMany
    {
        return $this->anomalies()->whereIn('status', ['open', 'in_progress', 'escalated']);
    }

    public function getDaysInStockAttribute(): ?int
    {
        if (!$this->arrival_date) {
            return null;
        }
        $endDate = $this->sold_date ?? now();
        return $this->arrival_date->diffInDays($endDate);
    }

    public function getPreparationCostAttribute()
    {
        return $this->preparationItems()->where('status', 'completed')->sum('actual_cost');
    }

    public function getTotalCostAttribute()
    {
        return ($this->purchase_price ?? 0) + $this->preparation_cost;
    }

    public function getProfitAttribute()
    {
        if (!$this->actual_sale_price) {
            return null;
        }
        return $this->actual_sale_price - $this->total_cost;
    }

    public function getProfitMarginAttribute()
    {
        if (!$this->actual_sale_price || $this->total_cost == 0) {
            return null;
        }
        return round(($this->profit / $this->total_cost) * 100, 2);
    }

    public function getMissingDocumentsCountAttribute(): int
    {
        return $this->financeDocuments()->where('status', 'missing')->count();
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeInStock($query)
    {
        return $query->whereIn('status', [self::STATUS_PREPARING, self::STATUS_AVAILABLE]);
    }
}
