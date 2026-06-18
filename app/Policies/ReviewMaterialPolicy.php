<?php

namespace App\Policies;

use App\Models\ReviewMaterial;
use App\Models\User;

class ReviewMaterialPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ReviewMaterial $review): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'store_manager', 'operation_manager', 'sales']);
    }

    public function update(User $user, ReviewMaterial $review): bool
    {
        if ($user->hasAnyRole(['admin', 'store_manager', 'operation_manager'])) return true;
        return $review->created_by === $user->id;
    }

    public function approve(User $user, ReviewMaterial $review): bool
    {
        return $user->hasAnyRole(['admin', 'operation_manager'])
            || ($user->hasRole('store_manager') && $review->store_id === $user->store_id);
    }
}
