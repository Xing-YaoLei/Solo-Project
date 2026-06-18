<?php

namespace App\Models;

use App\Traits\HasTimelines;
use App\Traits\HasAttachments;
use App\Traits\HasNotes;
use App\Enums\TimelineCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class ReviewMaterial extends Model
{
    use SoftDeletes, HasTimelines, HasAttachments, HasNotes;

    protected $fillable = [
        'code', 'type', 'level', 'title', 'summary', 'background',
        'process_description', 'problem_analysis', 'improvement_measures',
        'lessons_learned', 'action_items', 'status', 'reviewed_at',
        'reviewed_by', 'review_opinion', 'test_drive_id', 'customer_id',
        'store_id', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'action_items' => 'array',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->code)) {
                $model->code = 'RV' . date('YmdHis') . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            }
            $userId = Auth::check() ? Auth::id() : null;
            if (empty($model->created_by)) $model->created_by = $userId;
            if (empty($model->updated_by)) $model->updated_by = $userId;
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    public function testDrive(): BelongsTo
    {
        return $this->belongsTo(TestDrive::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function timelinesLinked(): BelongsToMany
    {
        return $this->belongsToMany(
            Timeline::class,
            'timeline_review_links',
            'review_material_id',
            'timeline_id'
        )->withPivot(['relation_type', 'relation_note', 'created_by'])->withTimestamps();
    }

    public function linkTimeline(Timeline $timeline, int $relationType = 1, ?string $note = null): void
    {
        $this->timelinesLinked()->attach($timeline->id, [
            'relation_type' => $relationType,
            'relation_note' => $note,
            'created_by' => Auth::check() ? Auth::id() : null,
        ]);

        $this->addTimeline(
            TimelineCategory::REVIEW,
            5,
            '关联处理记录',
            sprintf('关联记录：%s - %s', $timeline->category?->label() ?? '未知', $timeline->action_name),
            null, null, null, null,
            ['related_timeline_id' => $timeline->id]
        );
    }

    public function linkRelatedTimelinesFromSource(): int
    {
        $count = 0;
        if ($this->testDrive) {
            foreach ($this->testDrive->timelines as $timeline) {
                if (!$this->timelinesLinked()->where('timeline_id', $timeline->id)->exists()) {
                    $this->linkTimeline($timeline, 1, '自动关联自试驾记录');
                    $count++;
                }
            }
        }
        if ($this->customer) {
            foreach ($this->customer->timelines as $timeline) {
                if (!$this->timelinesLinked()->where('timeline_id', $timeline->id)->exists()) {
                    $this->linkTimeline($timeline, 2, '自动关联自客户线索');
                    $count++;
                }
            }
        }
        return $count;
    }

    public function getLinkedSourceRecords(): array
    {
        $sources = [];
        if ($this->testDrive) {
            $sources[] = [
                'type' => 'test_drive',
                'label' => '试驾记录',
                'code' => $this->testDrive->code,
                'id' => $this->testDrive->id,
                'url' => route('test-drives.show', $this->testDrive->id),
            ];
        }
        if ($this->customer) {
            $sources[] = [
                'type' => 'customer',
                'label' => '客户线索',
                'code' => $this->customer->phone,
                'id' => $this->customer->id,
                'url' => route('customers.show', $this->customer->id),
            ];
        }
        return $sources;
    }
}
