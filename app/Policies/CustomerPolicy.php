<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CustomerPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Customer $customer): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'store_manager', 'sales', 'receptionist']);
    }

    public function update(User $user, Customer $customer): bool
    {
        if ($user->hasAnyRole(['admin', 'store_manager'])) return true;
        return $customer->assigned_user_id === $user->id
            || $customer->created_by === $user->id;
    }

    public function batchAssign(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'store_manager']);
    }
}
