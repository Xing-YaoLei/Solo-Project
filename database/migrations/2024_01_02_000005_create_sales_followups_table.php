<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_followups', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->unsignedTinyInteger('type')->default(1);
            $table->unsignedTinyInteger('channel')->default(1);
            $table->dateTime('followup_at');
            $table->dateTime('next_followup_at')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->unsignedTinyInteger('intent_change')->nullable();
            $table->string('content_summary', 500)->nullable();
            $table->text('content_detail')->nullable();
            $table->text('customer_question')->nullable();
            $table->text('objection')->nullable();
            $table->text('solution')->nullable();
            $table->text('remark')->nullable();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('test_drive_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['customer_id', 'status', 'followup_at']);
            $table->index(['test_drive_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['store_id', 'followup_at']);
            $table->index(['next_followup_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_followups');
    }
};
