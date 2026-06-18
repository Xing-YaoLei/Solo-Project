<?php

namespace App\Models;

use App\Traits\HasTimelines;
use App\Traits\HasAttachments;
use App\Traits\HasNotes;
use App\Enums\TimelineCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class SalesFollowup extends Model
{
    use SoftDeletes, HasTimelines, HasAttachments, HasNotes;

    protected $fillable = [
        'code', 'type', 'channel', 'followup_at', 'next_followup_at',
        'status', 'intent_change', 'content_summary', 'content_detail',
        'customer_question', 'objection', 'solution', 'remark',
        'customer_id', 'test_drive_id', 'vehicle_id', 'store_id',
        'user_id', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'followup_at' => 'datetime',
            'next_followup_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->code)) {
                $model->code = 'FU' . date('YmdHis') . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            }
            $userId = Auth::check() ? Auth::id() : null;
            if (empty($model->created_by)) $model->created_by = $userId;
            if (empty($model->updated_by)) $model->updated_by = $userId;
            if (empty($model->user_id)) $model->user_id = $userId;
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function testDrive(): BelongsTo
    {
        return $this->belongsTo(TestDrive::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function linkToTimeline(Timeline $timeline, int $relationType = 1, ?string $note = null): void
    {
        if ($this->testDrive) {
            // 通过复盘关联表实现双向追溯
        }
    }
}
