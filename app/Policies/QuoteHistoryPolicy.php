<?php

namespace App\Policies;

use App\Models\QuoteHistory;
use App\Models\User;

class QuoteHistoryPolicy
{
    public function create(User $user): bool
    {
        return $user->isAppraiser()
            || $user->isSales()
            || $user->isManager()
            || $user->hasPermission('quote.create');
    }

    public function update(User $user, QuoteHistory $quote): bool
    {
        if ($user->isManager()) return true;
        if ($user->hasPermission('quote.update')) return true;
        if ($quote->quoted_by === $user->id) return true;
        return false;
    }

    public function delete(User $user, QuoteHistory $quote): bool
    {
        return $user->isManager() || $user->hasPermission('quote.delete');
    }

    public function approve(User $user, QuoteHistory $quote): bool
    {
        return $user->isManager() || $user->hasPermission('quote.approve');
    }
}
