<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'loggable_type', 'loggable_id', 'action', 'description',
        'before_data', 'after_data', 'user_id', 'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'before_data' => 'json',
            'after_data' => 'json',
        ];
    }

    public function loggable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
