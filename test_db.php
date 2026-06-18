<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Laravel DB connection...\n";

try {
    $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
    echo "Tables found:\n";
    foreach ($tables as $table) {
        echo "  - name: '" . ($table->name ?? 'NULL') . "'\n";
        echo "    object vars: " . json_encode(get_object_vars($table)) . "\n";
    }
    
    echo "\nChecking migrations table:\n";
    $migrations = DB::select("SELECT * FROM migrations");
    foreach ($migrations as $m) {
        echo "  object vars: " . json_encode(get_object_vars($m)) . "\n";
        echo "  migration property exists? " . (property_exists($m, 'migration') ? 'YES' : 'NO') . "\n";
    }
} catch (\Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
