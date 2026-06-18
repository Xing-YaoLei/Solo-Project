<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing DatabaseMigrationRepository...\n";

try {
    $repo = app('migration.repository');
    
    echo "Calling getRan()...\n";
    $ran = $repo->getRan();
    echo "getRan() returned:\n";
    print_r($ran);
} catch (\Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
    
    // Let's debug the actual query
    echo "\nDebugging the query...\n";
    $query = DB::table('migrations')->orderBy('batch', 'asc')->orderBy('migration', 'asc');
    echo "SQL: " . $query->toSql() . "\n";
    
    $results = DB::select($query->toSql());
    echo "\nRaw results:\n";
    foreach ($results as $row) {
        echo "  Row:\n";
        echo "    vars: " . json_encode(get_object_vars($row)) . "\n";
        echo "    migration exists? " . (property_exists($row, 'migration') ? 'YES' : 'NO') . "\n";
    }
    
    echo "\nAll tables:\n";
    $tables = DB::select("SELECT name, sql FROM sqlite_master WHERE type='table'");
    foreach ($tables as $t) {
        echo "  name: '" . ($t->name ?? 'NULL') . "'\n";
        echo "    sql: " . ($t->sql ?? 'NULL') . "\n";
    }
}
