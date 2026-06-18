<?php

namespace App\Traits;

use App\Models\Note;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

trait HasNotes
{
    public function notes(): MorphMany
    {
        return $this->morphMany(Note::class, 'notable')->latest();
    }

    public function addNote(
        string $content,
        int $type = 1,
        int $priority = 2,
        bool $isInternal = true,
        ?int $userId = null
    ): Note
    {
        $userId = $userId ?? (Auth::check() ? Auth::id() : null);

        return $this->notes()->create([
            'content' => $content,
            'type' => $type,
            'priority' => $priority,
            'is_internal' => $isInternal,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }
}
