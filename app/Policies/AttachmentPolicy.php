<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\User;

class AttachmentPolicy
{
    public function delete(User $user, Attachment $attachment): bool
    {
        if ($user->hasAnyRole(['admin', 'store_manager'])) return true;
        return $attachment->created_by === $user->id;
    }
}
