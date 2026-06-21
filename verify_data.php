<?php

define('LARAVEL_START', microtime(true));

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Database verification:\n";
echo "====================\n";

echo "Users: " . App\Models\User::count() . "\n";
echo "Roles: " . Spatie\Permission\Models\Role::count() . "\n";
echo "Vehicles: " . App\Models\Vehicle::count() . "\n";
echo "Permissions: " . App\Models\Permission::count() . "\n";

$v = App\Models\Vehicle::first();
if ($v) {
    echo "First vehicle: " . $v->brand . " " . $v->model . " (ID: " . $v->id . ")\n";
}

echo "\nRedis verification:\n";
echo "==================\n";
try {
    $redis = \Illuminate\Support\Facades\Redis::connection();
    $redis->set('test:key', 'hello');
    echo "Redis connection: OK\n";
    echo "Test value: " . $redis->get('test:key') . "\n";
    $redis->del('test:key');
} catch (Exception $e) {
    echo "Redis error: " . $e->getMessage() . "\n";
}

echo "\nQueue verification:\n";
echo "==================\n";
echo "Queue connection: " . config('queue.default') . "\n";
echo "Cache store: " . config('cache.default') . "\n";
