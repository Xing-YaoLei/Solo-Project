<?php

namespace App\Policies;

use App\Models\TestDrive;
use App\Models\User;
use App\Enums\TestDriveStatus;
use Illuminate\Auth\Access\Response;

class TestDrivePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, TestDrive $testDrive): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'store_manager', 'sales', 'receptionist']);
    }

    public function update(User $user, TestDrive $testDrive): bool
    {
        if ($user->hasAnyRole(['admin', 'store_manager'])) return true;
        return $testDrive->sales_user_id === $user->id
            || $testDrive->assigned_user_id === $user->id
            || $testDrive->companion_user_id === $user->id;
    }

    public function confirm(User $user, TestDrive $testDrive): bool
    {
        if ($testDrive->status !== TestDriveStatus::PENDING) return false;
        return $user->hasAnyRole(['admin', 'store_manager'])
            || $testDrive->assigned_user_id === $user->id
            || $testDrive->sales_user_id === $user->id;
    }

    public function supplement(User $user, TestDrive $testDrive): bool
    {
        if (in_array($testDrive->status->value, [TestDriveStatus::CLOSED->value, TestDriveStatus::CANCELLED->value])) return false;
        return true;
    }

    public function close(User $user, TestDrive $testDrive): bool
    {
        if (in_array($testDrive->status->value, [TestDriveStatus::CLOSED->value, TestDriveStatus::CANCELLED->value])) return false;
        return $user->hasAnyRole(['admin', 'store_manager'])
            || $testDrive->assigned_user_id === $user->id;
    }

    public function markNoShow(User $user, TestDrive $testDrive): bool
    {
        if ($testDrive->is_no_show) return false;
        if ($testDrive->status === TestDriveStatus::COMPLETED) return false;
        return $user->hasAnyRole(['admin', 'store_manager'])
            || $testDrive->assigned_user_id === $user->id
            || $testDrive->sales_user_id === $user->id;
    }

    public function adjustResponsibility(User $user, TestDrive $testDrive): bool
    {
        if (!$testDrive->is_no_show) return false;
        return $user->hasAnyRole(['admin', 'store_manager', 'operation_manager'])
            || $testDrive->assigned_user_id === $user->id;
    }

    public function batchUpdate(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'store_manager']);
    }
}
