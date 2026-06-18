<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_drives', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->unsignedTinyInteger('type')->default(1);
            $table->dateTime('appointment_at');
            $table->dateTime('appointment_end_at')->nullable();
            $table->dateTime('actual_start_at')->nullable();
            $table->dateTime('actual_end_at')->nullable();
            $table->unsignedInteger('planned_duration')->default(30);
            $table->unsignedInteger('actual_duration')->nullable();
            $table->unsignedTinyInteger('status')->default(10);
            $table->boolean('is_no_show')->default(false);
            $table->unsignedTinyInteger('no_show_reason')->nullable();
            $table->text('no_show_impact_scope')->nullable();
            $table->unsignedTinyInteger('responsibility_role')->nullable();
            $table->text('responsibility_note')->nullable();
            $table->string('pickup_location', 255)->nullable();
            $table->string('return_location', 255)->nullable();
            $table->text('planned_route')->nullable();
            $table->decimal('start_mileage', 10, 2)->nullable();
            $table->decimal('end_mileage', 10, 2)->nullable();
            $table->decimal('start_fuel_level', 5, 2)->nullable();
            $table->decimal('end_fuel_level', 5, 2)->nullable();
            $table->unsignedTinyInteger('customer_satisfaction')->nullable();
            $table->text('customer_feedback')->nullable();
            $table->text('accident_record')->nullable();
            $table->text('violation_record')->nullable();
            $table->text('remark')->nullable();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('vehicle_id')->constrained()->restrictOnDelete();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sales_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('companion_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('converted_customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['store_id', 'status', 'appointment_at']);
            $table->index(['customer_id', 'status']);
            $table->index(['vehicle_id', 'status']);
            $table->index(['sales_user_id', 'status']);
            $table->index(['is_no_show', 'status']);
            $table->index(['appointment_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_drives');
    }
};
