<?php

namespace App\Traits;

use App\Models\Timeline;
use App\Enums\TimelineCategory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

trait HasTimelines
{
    public function timelines(): MorphMany
    {
        return $this->morphMany(Timeline::class, 'timelineable')->latest();
    }

    public function addTimeline(
        TimelineCategory $category,
        int $actionType,
        string $actionName,
        ?string $content = null,
        ?string $fieldName = null,
        mixed $oldValue = null,
        mixed $newValue = null,
        ?int $userId = null,
        array $extra = []
    ): Timeline
    {
        $userId = $userId ?? (Auth::check() ? Auth::id() : null);
        $request = request();

        return $this->timelines()->create(array_merge([
            'category' => $category->value,
            'action_type' => $actionType,
            'action_name' => $actionName,
            'field_name' => $fieldName,
            'old_value' => is_array($oldValue) || is_object($oldValue) ? json_encode($oldValue, JSON_UNESCAPED_UNICODE) : $oldValue,
            'new_value' => is_array($newValue) || is_object($newValue) ? json_encode($newValue, JSON_UNESCAPED_UNICODE) : $newValue,
            'content' => $content,
            'user_id' => $userId,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'device_type' => $request && $request->userAgent()
                ? (preg_match('/(iphone|android|mobile)/i', $request->userAgent()) ? 'mobile' : 'desktop')
                : null,
        ], $extra));
    }
}
