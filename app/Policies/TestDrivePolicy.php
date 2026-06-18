<?php

namespace App\Policies;

use App\Models\TestDrive;
use App\Models\User;

class TestDrivePolicy
{
    public function create(User $user): bool
    {
        return $user->isAppraiser()
            || $user->isSales()
            || $user->isManager()
            || $user->hasPermission('test_drive.create');
    }

    public function update(User $user, TestDrive $testDrive): bool
    {
        if ($user->isManager()) return true;
        if ($user->hasPermission('test_drive.update')) return true;
        if ($testDrive->accompanied_by === $user->id) return true;
        return false;
    }

    public function delete(User $user, TestDrive $testDrive): bool
    {
        return $user->isManager() || $user->hasPermission('test_drive.delete');
    }
}
