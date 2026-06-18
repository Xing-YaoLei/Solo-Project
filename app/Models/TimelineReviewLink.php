<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimelineReviewLink extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'timeline_id', 'review_material_id', 'relation_type',
        'relation_note', 'created_by',
    ];

    public function timeline(): BelongsTo
    {
        return $this->belongsTo(Timeline::class);
    }

    public function reviewMaterial(): BelongsTo
    {
        return $this->belongsTo(ReviewMaterial::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
