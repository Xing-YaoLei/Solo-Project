<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\User;

class AttachmentPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function delete(User $user, Attachment $attachment): bool
    {
        if ($user->isManager()) return true;
        if ($attachment->uploaded_by === $user->id) return true;
        return false;
    }

    public function download(User $user, Attachment $attachment): bool
    {
        return true;
    }
}
