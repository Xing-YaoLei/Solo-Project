<?php

namespace App\Models;

use App\Traits\HasTimelines;
use App\Traits\HasAttachments;
use App\Traits\HasNotes;
use App\Enums\TestDriveStatus;
use App\Enums\ResponsibilityRole;
use App\Enums\TimelineCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class TestDrive extends Model
{
    use SoftDeletes, HasTimelines, HasAttachments, HasNotes;

    protected $fillable = [
        'code', 'type', 'appointment_at', 'appointment_end_at',
        'actual_start_at', 'actual_end_at', 'planned_duration', 'actual_duration',
        'status', 'is_no_show', 'no_show_reason', 'no_show_impact_scope',
        'responsibility_role', 'responsibility_note', 'pickup_location',
        'return_location', 'planned_route', 'start_mileage', 'end_mileage',
        'start_fuel_level', 'end_fuel_level', 'customer_satisfaction',
        'customer_feedback', 'accident_record', 'violation_record', 'remark',
        'customer_id', 'vehicle_id', 'store_id', 'sales_user_id',
        'companion_user_id', 'assigned_user_id', 'converted_customer_id',
        'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => TestDriveStatus::class,
            'responsibility_role' => ResponsibilityRole::class,
            'appointment_at' => 'datetime',
            'appointment_end_at' => 'datetime',
            'actual_start_at' => 'datetime',
            'actual_end_at' => 'datetime',
            'is_no_show' => 'boolean',
            'start_mileage' => 'decimal:2',
            'end_mileage' => 'decimal:2',
            'start_fuel_level' => 'decimal:2',
            'end_fuel_level' => 'decimal:2',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->code)) {
                $model->code = 'TD' . date('YmdHis') . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            }
            if (empty($model->created_by)) {
                $model->created_by = Auth::check() ? Auth::id() : null;
            }
            if (empty($model->updated_by)) {
                $model->updated_by = Auth::check() ? Auth::id() : null;
            }
        });

        static::updating(function ($model) {
            $model->updated_by = Auth::check() ? Auth::id() : null;
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function salesUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_user_id');
    }

    public function companionUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'companion_user_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function convertedCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'converted_customer_id');
    }

    public function followups(): HasMany
    {
        return $this->hasMany(SalesFollowup::class);
    }

    public function reviewMaterials(): HasMany
    {
        return $this->hasMany(ReviewMaterial::class);
    }

    public function responsibilityAdjustments(): HasMany
    {
        return $this->hasMany(ResponsibilityAdjustment::class);
    }

    public function latestResponsibilityAdjustment(): HasOne
    {
        return $this->hasOne(ResponsibilityAdjustment::class)->latestOfMany();
    }

    public function updateStatus(TestDriveStatus $newStatus, ?string $note = null): bool
    {
        $oldStatus = $this->status;
        $this->status = $newStatus;
        $result = $this->save();

        if ($result) {
            $this->addTimeline(
                TimelineCategory::STATUS_CHANGE,
                1,
                sprintf('状态变更：%s → %s', $oldStatus?->label() ?? '无', $newStatus->label()),
                $note,
                'status',
                $oldStatus?->value,
                $newStatus->value
            );
        }

        return $result;
    }

    public function confirm(?int $userId = null): bool
    {
        $userId = $userId ?? Auth::id();
        return $this->updateStatus(TestDriveStatus::CONFIRMED, '试驾预约已确认');
    }

    public function supplement(array $data, ?int $userId = null): bool
    {
        $this->fill($data);
        $result = $this->save();
        if ($result) {
            $this->addTimeline(
                TimelineCategory::FIELD_CHANGE,
                2,
                '移动端补充资料',
                json_encode($data, JSON_UNESCAPED_UNICODE)
            );
        }
        return $result;
    }

    public function close(?string $closeNote = null, ?int $userId = null): bool
    {
        $result = $this->updateStatus(TestDriveStatus::CLOSED, $closeNote ?? '流程已关闭');
        return $result;
    }

    public function markNoShow(
        int $reason,
        ?string $impactScope = null,
        ?int $responsibilityRole = null,
        ?string $responsibilityNote = null,
        ?int $userId = null
    ): bool {
        $userId = $userId ?? Auth::id();
        $this->is_no_show = true;
        $this->no_show_reason = $reason;
        $this->no_show_impact_scope = $impactScope;
        $this->responsibility_role = $responsibilityRole;
        $this->responsibility_note = $responsibilityNote;
        $this->status = TestDriveStatus::NO_SHOW;

        $result = $this->save();
        if ($result) {
            $this->addTimeline(
                TimelineCategory::RESPONSIBILITY,
                3,
                '标记试驾爽约',
                sprintf('原因：%s；影响范围：%s；初步责任：%s',
                    $reason,
                    $impactScope ?? '未标注',
                    $responsibilityRole ? ResponsibilityRole::from($responsibilityRole)->label() : '待定'
                )
            );
        }
        return $result;
    }

    public function adjustResponsibility(
        ?int $newResponsibilityRole,
        ?int $newAssignedUserId,
        string $reason,
        ?string $impactedAreas = null,
        ?string $supplementNote = null,
        ?int $submittedById = null
    ): ResponsibilityAdjustment {
        $submittedById = $submittedById ?? Auth::id();
        $adjustment = $this->responsibilityAdjustments()->create([
            'old_responsibility_role' => $this->responsibility_role?->value,
            'new_responsibility_role' => $newResponsibilityRole,
            'old_assigned_user_id' => $this->assigned_user_id,
            'new_assigned_user_id' => $newAssignedUserId,
            'reason' => $reason,
            'supplement_note' => $supplementNote,
            'impacted_areas' => $impactedAreas,
            'status' => 1,
            'submitted_by' => $submittedById,
        ]);

        if ($newResponsibilityRole) {
            $this->responsibility_role = $newResponsibilityRole;
        }
        if ($newAssignedUserId) {
            $this->assigned_user_id = $newAssignedUserId;
        }
        if ($responsibilityNote = $supplementNote) {
            $this->responsibility_note = $responsibilityNote;
        }
        $this->save();

        $this->addTimeline(
            TimelineCategory::RESPONSIBILITY,
            4,
            '责任归属调整',
            sprintf('调整说明：%s', $reason),
            'responsibility_role',
            $adjustment->old_responsibility_role,
            $adjustment->new_responsibility_role
        );

        return $adjustment;
    }
}
