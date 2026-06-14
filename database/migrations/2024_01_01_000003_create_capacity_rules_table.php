<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capacity_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('rule_type', ['default', 'special', 'holiday'])->default('default');
            $table->foreignId('time_slot_id')->constrained()->cascadeOnDelete();
            $table->date('apply_date')->nullable()->comment('特定日期，null表示按星期规则');
            $table->tinyInteger('day_of_week')->nullable()->comment('0=周日...6=周六');
            $table->integer('max_capacity');
            $table->integer('warn_capacity')->default(0)->comment('预警容量，达到此数提醒');
            $table->boolean('is_active')->default(true);
            $table->text('remark')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['time_slot_id', 'apply_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capacity_rules');
    }
};
