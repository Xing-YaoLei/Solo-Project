<?php

namespace App\Policies;

use App\Models\SalesFollowup;
use App\Models\User;

class SalesFollowupPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SalesFollowup $followup): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'store_manager', 'sales']);
    }

    public function update(User $user, SalesFollowup $followup): bool
    {
        if ($user->hasAnyRole(['admin', 'store_manager'])) return true;
        return $followup->user_id === $user->id
            || $followup->created_by === $user->id;
    }

    public function batchComplete(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'store_manager']);
    }
}
