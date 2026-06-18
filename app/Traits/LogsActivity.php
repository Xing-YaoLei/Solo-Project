<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    protected static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            $model->logActivity('created', '创建了记录', null, $model->toArray());
        });

        static::updated(function ($model) {
            $dirty = $model->getDirty();
            $original = $model->getOriginal();
            $before = [];
            $after = [];
            foreach ($dirty as $key => $value) {
                $before[$key] = $original[$key] ?? null;
                $after[$key] = $value;
            }
            $model->logActivity('updated', '更新了记录', $before, $after);
        });

        static::deleted(function ($model) {
            $model->logActivity('deleted', '删除了记录', $model->toArray(), null);
        });
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable')->latest();
    }

    public function logActivity(string $action, ?string $description = null, ?array $before = null, ?array $after = null): ActivityLog
    {
        return $this->activityLogs()->create([
            'action' => $action,
            'description' => $description,
            'before_data' => $before,
            'after_data' => $after,
            'user_id' => Auth::id(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
