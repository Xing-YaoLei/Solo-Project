<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_materials', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->unsignedTinyInteger('type')->default(1);
            $table->unsignedTinyInteger('level')->default(2);
            $table->string('title', 200);
            $table->text('summary')->nullable();
            $table->text('background')->nullable();
            $table->text('process_description')->nullable();
            $table->text('problem_analysis')->nullable();
            $table->text('improvement_measures')->nullable();
            $table->text('lessons_learned')->nullable();
            $table->text('action_items')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->dateTime('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_opinion')->nullable();
            $table->foreignId('test_drive_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('store_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['test_drive_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index(['store_id', 'status', 'created_at']);
            $table->index(['type', 'level', 'status']);
            $table->index(['created_by', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_materials');
    }
};
