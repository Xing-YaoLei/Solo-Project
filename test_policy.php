<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\User::where('email', 'manager@example.com')->first();
$gate = $app->make('Illuminate\Contracts\Auth\Access\Gate');

echo "User: " . $user->name . "\n";
echo "isManager: " . ($user->isManager() ? 'true' : 'false') . "\n";

$policy = $gate->getPolicyFor(App\Http\Controllers\StatisticsController::class);
echo "Policy class: " . ($policy ? get_class($policy) : 'null') . "\n";

if ($policy) {
    echo "Policy view result: " . ($policy->view($user) ? 'true' : 'false') . "\n";
}

echo "Gate allows: " . ($gate->forUser($user)->allows('view', App\Http\Controllers\StatisticsController::class) ? 'true' : 'false') . "\n";
