<?php

namespace App\Policies;

use App\Models\Anomaly;
use App\Models\User;

class AnomalyPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Anomaly $anomaly): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('anomaly.create')
            || $user->isAppraiser()
            || $user->isSales()
            || $user->isFinance()
            || $user->isManager();
    }

    public function handle(User $user, Anomaly $anomaly): bool
    {
        if ($user->isManager()) return true;
        if ($user->hasPermission('anomaly.handle')) return true;
        if ($user->isAppraiser() && in_array($anomaly->type, ['damage_dispute', 'price_dispute'])) return true;
        if ($user->isFinance() && in_array($anomaly->type, ['missing_doc', 'legal_risk'])) return true;
        if ($anomaly->reported_by === $user->id) return true;
        if ($anomaly->handled_by === $user->id) return true;
        return false;
    }

    public function approve(User $user, Anomaly $anomaly): bool
    {
        return $user->isManager() || $user->hasPermission('anomaly.approve');
    }

    public function escalate(User $user, Anomaly $anomaly): bool
    {
        return $this->handle($user, $anomaly);
    }
}
