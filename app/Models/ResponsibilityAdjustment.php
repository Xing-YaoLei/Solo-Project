<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;
use App\Enums\ResponsibilityRole;
use App\Enums\TimelineCategory;

class ResponsibilityAdjustment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'old_responsibility_role', 'new_responsibility_role',
        'old_assigned_user_id', 'new_assigned_user_id',
        'reason', 'supplement_note', 'status', 'impacted_areas',
        'test_drive_id', 'review_material_id',
        'submitted_by', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'old_responsibility_role' => ResponsibilityRole::class,
            'new_responsibility_role' => ResponsibilityRole::class,
            'approved_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $userId = Auth::check() ? Auth::id() : null;
            if (empty($model->submitted_by)) $model->submitted_by = $userId;
        });
    }

    public function testDrive(): BelongsTo
    {
        return $this->belongsTo(TestDrive::class);
    }

    public function reviewMaterial(): BelongsTo
    {
        return $this->belongsTo(ReviewMaterial::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function oldAssignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'old_assigned_user_id');
    }

    public function newAssignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'new_assigned_user_id');
    }

    public function approve(?int $approverId = null): bool
    {
        $approverId = $approverId ?? Auth::id();
        $this->status = 2;
        $this->approved_by = $approverId;
        $this->approved_at = now();
        $result = $this->save();

        if ($result && $this->testDrive) {
            $this->testDrive->addTimeline(
                TimelineCategory::RESPONSIBILITY,
                5,
                '责任调整已审批通过',
                sprintf('审批人：%s；调整理由：%s',
                    User::find($approverId)?->name ?? '未知',
                    $this->reason
                )
            );
        }
        return $result;
    }
}
