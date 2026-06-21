<?php

define('LARAVEL_START', microtime(true));

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Running migrations manually for MySQL...\n";

// First, clean up any empty table names that might exist
$tables = DB::select('SHOW TABLES');
foreach ($tables as $table) {
    $tableName = array_values((array)$table)[0];
    if (empty($tableName) || $tableName === '') {
        echo "Dropping empty table...\n";
        DB::statement("DROP TABLE `$tableName`");
    }
}

// Check if migrations table exists
$migrationsTable = DB::select("SHOW TABLES LIKE 'migrations'");
if (empty($migrationsTable)) {
    echo "Creating migrations table...\n";
    DB::statement("CREATE TABLE `migrations` (
        `id` int unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
        `migration` varchar(255) NOT NULL,
        `batch` int NOT NULL
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE 'utf8mb4_unicode_ci'");
}

// Get all migration files
$migrationFiles = glob(__DIR__ . '/database/migrations/*.php');
sort($migrationFiles);

$batch = DB::table('migrations')->max('batch') ?? 0;
$batch++;

foreach ($migrationFiles as $file) {
    $filename = basename($file, '.php');
    
    // Check if already migrated
    $exists = DB::table('migrations')->where('migration', $filename)->exists();
    if ($exists) {
        echo "Skipping: $filename (already migrated)\n";
        continue;
    }
    
    echo "Running: $filename\n";
    
    require_once $file;
    
    // Find the migration class
    $files = new RegexIterator(
        new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__ . '/database/migrations')),
        '/^.+\.php$/i',
        RegexIterator::GET_MATCH
    );
    
    $migrationClass = null;
    foreach ($files as $phpFile) {
        require_once $phpFile[0];
    }
    
    $classes = get_declared_classes();
    foreach ($classes as $class) {
        $reflection = new ReflectionClass($class);
        if ($reflection->getFileName() === $file) {
            $migrationClass = $class;
            break;
        }
    }
    
    if ($migrationClass) {
        $migration = new $migrationClass();
        
        try {
            // Run the migration
            $migration->up();
            
            // Clean up any empty tables that might have been created
            $tables = DB::select('SHOW TABLES');
            foreach ($tables as $table) {
                $tableName = array_values((array)$table)[0];
                if (empty($tableName) || $tableName === '') {
                    echo "  - Dropping empty table...\n";
                    DB::statement("DROP TABLE `$tableName`");
                }
            }
            
            // Record the migration
            DB::table('migrations')->insert([
                'migration' => $filename,
                'batch' => $batch,
            ]);
            
            echo "  - Completed\n";
        } catch (Exception $e) {
            echo "  - Error: " . $e->getMessage() . "\n";
            echo "    File: " . $e->getFile() . ":" . $e->getLine() . "\n";
            throw $e;
        }
    } else {
        echo "  - Could not find migration class\n";
    }
}

echo "\nAll migrations completed!\n";
