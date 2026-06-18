<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;

class NotePolicy
{
    public function update(User $user, Note $note): bool
    {
        if ($user->hasAnyRole(['admin', 'store_manager'])) return true;
        return $note->created_by === $user->id;
    }

    public function delete(User $user, Note $note): bool
    {
        if ($user->hasAnyRole(['admin', 'store_manager'])) return true;
        return $note->created_by === $user->id;
    }
}
