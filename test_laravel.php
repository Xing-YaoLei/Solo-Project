<?php

define('LARAVEL_START', microtime(true));

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

// Bootstrap the application
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing Laravel...\n";
echo "PHP Version: " . phpversion() . "\n";
echo "App Name: " . config('app.name') . "\n";
echo "App Environment: " . config('app.env') . "\n";
echo "Database Connection: " . config('database.default') . "\n\n";

// Test route resolution
echo "Testing routes...\n";
$routes = [
    'GET /login' => ['GET', '/login'],
    'GET /' => ['GET', '/'],
    'GET /vehicles/1' => ['GET', '/vehicles/1'],
    'GET /statistics' => ['GET', '/statistics'],
];

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

foreach ($routes as $name => [$method, $uri]) {
    try {
        $request = Illuminate\Http\Request::create($uri, $method);
        $response = $kernel->handle($request);
        $status = $response->getStatusCode();
        echo "  $name: $status\n";
        if ($status === 200 || $status === 302) {
            $content = $response->getContent();
            if (strpos($content, '<!DOCTYPE html>') !== false) {
                echo "    -> Returns HTML page\n";
            } elseif (strpos($content, '"component"') !== false) {
                echo "    -> Returns Inertia JSON\n";
                $data = json_decode($content, true);
                echo "    -> Component: " . ($data['component'] ?? 'N/A') . "\n";
            }
        }
        $kernel->terminate($request, $response);
    } catch (Exception $e) {
        echo "  $name: ERROR - " . $e->getMessage() . "\n";
        echo "    File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    }
}

// Test database connection
echo "\nTesting database...\n";
try {
    $users = \App\Models\User::count();
    echo "  Users count: $users\n";
    
    $vehicles = \App\Models\Vehicle::count();
    echo "  Vehicles count: $vehicles\n";
    
    if ($vehicles > 0) {
        $vehicle = \App\Models\Vehicle::first();
        echo "  First vehicle: " . $vehicle->brand . " " . $vehicle->model . "\n";
    }
    
    $roles = \Spatie\Permission\Models\Role::count();
    echo "  Roles count: $roles\n";
} catch (Exception $e) {
    echo "  Database error: " . $e->getMessage() . "\n";
}

echo "\nAll tests completed!\n";
