<?php

namespace App\Policies;

use App\Models\User;

class StatisticsPolicy
{
    public function view(User $user): bool
    {
        return $user->isManager()
            || $user->isFinance()
            || $user->hasPermission('statistics.view');
    }
}
