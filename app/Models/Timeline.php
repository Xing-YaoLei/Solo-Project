<?php

namespace App\Models;

use App\Enums\TimelineCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Timeline extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'timelineable_id', 'timelineable_type', 'category', 'action_type',
        'action_name', 'field_name', 'old_value', 'new_value', 'content',
        'ip_address', 'user_agent', 'device_type', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'category' => TimelineCategory::class,
            'deleted_at' => 'datetime',
        ];
    }

    public function timelineable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewMaterials(): BelongsToMany
    {
        return $this->belongsToMany(
            ReviewMaterial::class,
            'timeline_review_links',
            'timeline_id',
            'review_material_id'
        )->withPivot(['relation_type', 'relation_note', 'created_by'])->withTimestamps();
    }

    public function linkToReview(ReviewMaterial $review, int $relationType = 1, ?string $note = null): void
    {
        $this->reviewMaterials()->attach($review->id, [
            'relation_type' => $relationType,
            'relation_note' => $note,
            'created_by' => auth()->check() ? auth()->id() : null,
        ]);
    }
}
