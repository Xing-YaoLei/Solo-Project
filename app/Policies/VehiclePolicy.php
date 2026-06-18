<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vehicle;

class VehiclePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Vehicle $vehicle): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('vehicle.create')
            || $user->isAppraiser()
            || $user->isSales()
            || $user->isManager();
    }

    public function update(User $user, Vehicle $vehicle): bool
    {
        if ($user->isManager()) return true;
        if ($user->hasPermission('vehicle.update')) return true;
        if ($user->isAppraiser() && $vehicle->appraiser_id === $user->id) return true;
        if ($user->isSales() && $vehicle->sales_id === $user->id) return true;
        return false;
    }

    public function delete(User $user, Vehicle $vehicle): bool
    {
        return $user->isManager() || $user->hasPermission('vehicle.delete');
    }

    public function batchUpdate(User $user): bool
    {
        return $user->isManager() || $user->hasPermission('vehicle.batch_update');
    }

    public function export(User $user): bool
    {
        return $user->isManager() || $user->hasPermission('vehicle.export');
    }

    public function changeStatus(User $user, Vehicle $vehicle): bool
    {
        if ($user->isManager()) return true;
        if ($user->isAppraiser() && $vehicle->status === Vehicle::STATUS_PENDING) return true;
        if ($user->isSales() && in_array($vehicle->status, [Vehicle::STATUS_AVAILABLE, Vehicle::STATUS_PREPARING])) return true;
        return false;
    }
}
