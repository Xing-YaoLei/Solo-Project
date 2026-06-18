<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preparation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('category', 50)->comment('分类: exterior外观, interior内饰, mechanical机械, electrical电器, other其他');
            $table->string('name', 200)->comment('整备项目名称');
            $table->text('description')->nullable()->comment('问题描述');
            $table->decimal('estimated_cost', 10, 2)->nullable()->comment('预估费用');
            $table->decimal('actual_cost', 10, 2)->nullable()->comment('实际费用');
            $table->string('status', 30)->default('pending')->comment('pending待处理, in_progress处理中, completed已完成, cancelled取消');
            $table->dateTime('completed_at')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution')->nullable()->comment('处理结果说明');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preparation_items');
    }
};
