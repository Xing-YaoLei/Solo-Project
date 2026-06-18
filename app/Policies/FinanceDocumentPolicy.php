<?php

namespace App\Policies;

use App\Models\FinanceDocument;
use App\Models\User;

class FinanceDocumentPolicy
{
    public function create(User $user): bool
    {
        return $user->isFinance() || $user->isManager() || $user->hasPermission('finance.create');
    }

    public function update(User $user, FinanceDocument $document): bool
    {
        if ($user->isManager()) return true;
        if ($user->hasPermission('finance.update')) return true;
        if ($user->isFinance()) return true;
        return false;
    }

    public function delete(User $user, FinanceDocument $document): bool
    {
        return $user->isManager() || $user->hasPermission('finance.delete');
    }

    public function verify(User $user, FinanceDocument $document): bool
    {
        return $user->isFinance() || $user->isManager();
    }
}
