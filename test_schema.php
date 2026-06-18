<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Testing Schema facade...\n";

try {
    Schema::create('test_table', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->timestamps();
    });
    echo "Schema::create() reported success\n";
    
    // Check if table exists
    $tables = DB::select("SELECT name FROM sqlite_master WHERE type='table'");
    echo "Tables after create:\n";
    foreach ($tables as $t) {
        echo "  - name: '" . ($t->name ?? 'NULL') . "'\n";
    }
} catch (\Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
