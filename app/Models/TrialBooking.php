<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class TrialBooking extends Model
{
    use HasFactory, SoftDeletes;

    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_NEED_INFO = 'need_info';
    const STATUS_ESCALATED = 'escalated';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_CLOSED = 'closed';

    const STATUS_GROUPS = [
        'to_handle' => ['pending', 'confirmed'],
        'need_info' => ['need_info'],
        'escalated' => ['escalated'],
        'completed' => ['completed', 'cancelled'],
        'closed' => ['closed'],
    ];

    protected $fillable = [
        'booking_no',
        'student_name',
        'age',
        'gender',
        'parent_name',
        'phone',
        'source_channel',
        'source_detail',
        'course_id',
        'time_slot_id',
        'trial_date',
        'status',
        'remark',
        'attended',
        'attendance_note',
        'assigned_to',
        'created_by',
        'updated_by',
        'status_updated_at',
        'review_tags',
        'review_note',
        'reviewed_by',
        'reviewed_at',
        'escalated_to',
        'escalation_reason',
        'escalated_at',
    ];

    protected $casts = [
        'review_tags' => 'array',
        'attended' => 'boolean',
        'status_updated_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'escalated_at' => 'datetime',
        'trial_date' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $booking) {
            if (empty($booking->booking_no)) {
                $booking->booking_no = self::generateBookingNo();
            }
            if (empty($booking->status)) {
                $booking->status = self::STATUS_PENDING;
            }
            $booking->status_updated_at = now();
        });

        static::updating(function (self $booking) {
            if ($booking->isDirty('status')) {
                $booking->status_updated_at = now();
            }
        });
    }

    public static function generateBookingNo(): string
    {
        $prefix = 'TB' . date('Ymd');
        $last = self::where('booking_no', 'like', $prefix . '%')
            ->withTrashed()
            ->orderBy('booking_no', 'desc')
            ->first();

        if ($last) {
            $num = intval(substr($last->booking_no, -4)) + 1;
        } else {
            $num = 1;
        }

        return $prefix . str_pad($num, 4, '0', STR_PAD_LEFT);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function escalatedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'escalated_to');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(BookingFollowUp::class, 'booking_id')->orderBy('follow_up_at', 'desc');
    }

    public function conflicts(): HasMany
    {
        return $this->hasMany(BookingConflict::class, 'booking_id')->orderBy('created_at', 'desc');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'booking_id')->orderBy('created_at', 'desc');
    }

    public function scopeByGroup($query, string $group)
    {
        if (isset(self::STATUS_GROUPS[$group])) {
            return $query->whereIn('status', self::STATUS_GROUPS[$group]);
        }
        return $query;
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeNeedInfo($query)
    {
        return $query->where('status', self::STATUS_NEED_INFO);
    }

    public function scopeEscalated($query)
    {
        return $query->where('status', self::STATUS_ESCALATED);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('trial_date', '>=', now()->toDateString());
    }

    public function scopePast($query)
    {
        return $query->where('trial_date', '<', now()->toDateString());
    }

    public function scopeForDate($query, $date)
    {
        return $query->where('trial_date', $date);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('trial_date', [$startDate, $endDate]);
    }

    public function detectConflicts(): array
    {
        $conflicts = [];

        $capacityConflict = $this->checkCapacityConflict();
        if ($capacityConflict) {
            $conflicts[] = $capacityConflict;
        }

        $duplicateConflicts = $this->checkDuplicateConflicts();
        if ($duplicateConflicts) {
            $conflicts = array_merge($conflicts, $duplicateConflicts);
        }

        return $conflicts;
    }

    protected function checkCapacityConflict(): ?array
    {
        $timeSlot = $this->timeSlot;
        if (!$timeSlot) {
            return null;
        }

        $maxCapacity = $timeSlot->getCapacityForDate($this->trial_date);

        $currentCount = self::where('time_slot_id', $this->time_slot_id)
            ->where('trial_date', $this->trial_date)
            ->where('status', '!=', self::STATUS_CANCELLED)
            ->where('status', '!=', self::STATUS_CLOSED)
            ->when($this->exists, function ($q) {
                $q->where('id', '!=', $this->id);
            })
            ->count();

        if ($currentCount >= $maxCapacity) {
            return [
                'type' => 'capacity_full',
                'description' => "时段容量已满（{$currentCount}/{$maxCapacity}）",
                'data' => [
                    'current_count' => $currentCount,
                    'max_capacity' => $maxCapacity,
                    'warn_capacity' => $timeSlot->capacityRules()
                        ->where('is_active', true)
                        ->value('warn_capacity') ?? 0,
                ],
            ];
        }

        return null;
    }

    protected function checkDuplicateConflicts(): array
    {
        $conflicts = [];

        $duplicateByPhone = self::where('phone', $this->phone)
            ->where('trial_date', $this->trial_date)
            ->where('status', '!=', self::STATUS_CANCELLED)
            ->where('status', '!=', self::STATUS_CLOSED)
            ->when($this->exists, function ($q) {
                $q->where('id', '!=', $this->id);
            })
            ->get();

        if ($duplicateByPhone->isNotEmpty()) {
            $conflicts[] = [
                'type' => 'phone_duplicate',
                'description' => "该手机号在同一天已有 {$duplicateByPhone->count()} 个预约",
                'data' => [
                    'duplicate_count' => $duplicateByPhone->count(),
                    'duplicate_ids' => $duplicateByPhone->pluck('id')->toArray(),
                    'duplicate_student_names' => $duplicateByPhone->pluck('student_name')->toArray(),
                ],
                'related_bookings' => $duplicateByPhone,
            ];
        }

        if ($this->student_name) {
            $duplicateByName = self::where('student_name', $this->student_name)
                ->where('trial_date', $this->trial_date)
                ->where('status', '!=', self::STATUS_CANCELLED)
                ->where('status', '!=', self::STATUS_CLOSED)
                ->when($this->exists, function ($q) {
                    $q->where('id', '!=', $this->id);
                })
                ->get();

            if ($duplicateByName->isNotEmpty()) {
                $conflicts[] = [
                    'type' => 'student_duplicate',
                    'description' => "该学员姓名在同一天已有 {$duplicateByName->count()} 个预约",
                    'data' => [
                        'duplicate_count' => $duplicateByName->count(),
                        'duplicate_ids' => $duplicateByName->pluck('id')->toArray(),
                    ],
                    'related_bookings' => $duplicateByName,
                ];
            }
        }

        return $conflicts;
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $allowedTransitions = [
            self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_NEED_INFO, self::STATUS_ESCALATED, self::STATUS_CANCELLED],
            self::STATUS_CONFIRMED => [self::STATUS_PENDING, self::STATUS_COMPLETED, self::STATUS_NEED_INFO, self::STATUS_ESCALATED, self::STATUS_CANCELLED],
            self::STATUS_NEED_INFO => [self::STATUS_PENDING, self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
            self::STATUS_ESCALATED => [self::STATUS_CONFIRMED, self::STATUS_PENDING, self::STATUS_CANCELLED],
            self::STATUS_COMPLETED => [self::STATUS_CLOSED],
            self::STATUS_CANCELLED => [self::STATUS_CLOSED],
            self::STATUS_CLOSED => [],
        ];

        return in_array($newStatus, $allowedTransitions[$this->status] ?? []);
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            self::STATUS_PENDING => '待跟进',
            self::STATUS_CONFIRMED => '已确认',
            self::STATUS_NEED_INFO => '补资料',
            self::STATUS_ESCALATED => '升级复核',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_CANCELLED => '已取消',
            self::STATUS_CLOSED => '已关闭',
        ];

        return $labels[$this->status] ?? $this->status;
    }

    public function getStatusColorAttribute(): string
    {
        $colors = [
            self::STATUS_PENDING => 'warning',
            self::STATUS_CONFIRMED => 'info',
            self::STATUS_NEED_INFO => 'warning',
            self::STATUS_ESCALATED => 'danger',
            self::STATUS_COMPLETED => 'success',
            self::STATUS_CANCELLED => 'secondary',
            self::STATUS_CLOSED => 'gray',
        ];

        return $colors[$this->status] ?? 'gray';
    }

    public function getIsClosedAttribute(): bool
    {
        return in_array($this->status, [self::STATUS_CLOSED]);
    }

    public function getCanEditAttribute(): bool
    {
        return !in_array($this->status, [self::STATUS_CLOSED]);
    }

    public function getClosedAtAttribute()
    {
        if ($this->status === self::STATUS_CLOSED) {
            return $this->status_updated_at;
        }
        return null;
    }

    public function getTrialFeedbackAttribute()
    {
        return $this->attendance_note;
    }

    public function getSignupIntentAttribute()
    {
        return $this->review_tags ? $this->review_tags[0] ?? null : null;
    }
}
