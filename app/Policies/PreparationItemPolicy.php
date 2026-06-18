<?php

namespace App\Policies;

use App\Models\PreparationItem;
use App\Models\User;

class PreparationItemPolicy
{
    public function create(User $user): bool
    {
        return $user->isAppraiser()
            || $user->isManager()
            || $user->isSales()
            || $user->hasPermission('preparation.create');
    }

    public function update(User $user, PreparationItem $item): bool
    {
        if ($user->isManager()) return true;
        if ($user->hasPermission('preparation.update')) return true;
        if ($item->handled_by === $user->id) return true;
        return $user->isAppraiser();
    }

    public function delete(User $user, PreparationItem $item): bool
    {
        return $user->isManager() || $user->hasPermission('preparation.delete');
    }

    public function batchUpdate(User $user): bool
    {
        return $user->isManager() || $user->isAppraiser();
    }
}
