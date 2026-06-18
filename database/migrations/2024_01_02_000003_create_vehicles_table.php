<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vin', 50)->unique();
            $table->string('plate_number', 20)->nullable()->index();
            $table->string('brand', 50)->index();
            $table->string('series', 50)->nullable();
            $table->string('model', 100);
            $table->year('year')->nullable();
            $table->string('color', 20)->nullable();
            $table->unsignedInteger('mileage')->nullable();
            $table->string('displacement', 20)->nullable();
            $table->string('transmission', 20)->nullable();
            $table->string('fuel_type', 20)->nullable();
            $table->unsignedInteger('seats')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->date('first_register_date')->nullable();
            $table->unsignedTinyInteger('emission_standard')->nullable();
            $table->unsignedTinyInteger('condition_level')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->boolean('is_test_drive_eligible')->default(true);
            $table->text('features')->nullable();
            $table->text('remark')->nullable();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['brand', 'series']);
            $table->index(['store_id', 'status']);
            $table->index(['status', 'is_test_drive_eligible']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
