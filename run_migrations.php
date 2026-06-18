<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Running migrations manually...\n";

// First, make sure we have a clean migrations table
$pdo = DB::connection()->getPdo();
$pdo->exec('DROP TABLE IF EXISTS ""');
$pdo->exec('VACUUM');

// Check if migrations table exists, create if not
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")->fetchAll();
if (empty($tables)) {
    echo "Creating migrations table...\n";
    $pdo->exec("CREATE TABLE migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration VARCHAR(255) NOT NULL,
        batch INTEGER NOT NULL
    )");
}

// Get all migration files
$migrationDir = __DIR__ . '/database/migrations';
$files = glob($migrationDir . '/*.php');
sort($files);

// Get ran migrations
$ran = $pdo->query("SELECT migration FROM migrations")->fetchAll(PDO::FETCH_COLUMN);
$batch = $pdo->query("SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations")->fetchColumn();

foreach ($files as $file) {
    $migrationName = pathinfo($file, PATHINFO_FILENAME);
    
    if (in_array($migrationName, $ran)) {
        echo "Skipping $migrationName (already ran)\n";
        continue;
    }
    
    echo "Running $migrationName...\n";
    
    // Clean up any empty name table that might be created
    $pdo->exec('DROP TABLE IF EXISTS ""');
    
    try {
        $migration = require $file;
        $migration->up();
        
        // Insert record
        $stmt = $pdo->prepare("INSERT INTO migrations (migration, batch) VALUES (?, ?)");
        $stmt->execute([$migrationName, $batch]);
        
        echo "  ✓ Done\n";
    } catch (\Exception $e) {
        echo "  ✗ Error: " . $e->getMessage() . "\n";
        echo $e->getTraceAsString() . "\n";
        exit(1);
    }
    
    // Clean up again
    $pdo->exec('DROP TABLE IF EXISTS ""');
}

echo "\nAll migrations completed successfully!\n";

// Verify
$ran = $pdo->query("SELECT * FROM migrations ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
echo "\nMigration records:\n";
foreach ($ran as $r) {
    echo "  {$r['id']}. {$r['migration']} (batch {$r['batch']})\n";
}
