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
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->dateTime('drive_at')->comment('试驾时间');
            $table->string('driver_name', 50)->comment('试驾人');
            $table->string('driver_phone', 20)->nullable();
            $table->integer('start_mileage')->comment('起始里程');
            $table->integer('end_mileage')->nullable()->comment('结束里程');
            $table->integer('duration_minutes')->nullable()->comment('试驾时长(分钟)');
            $table->text('route')->nullable()->comment('试驾路线');
            $table->text('performance')->nullable()->comment('动力表现');
            $table->text('brake_condition')->nullable()->comment('刹车情况');
            $table->text('steering_condition')->nullable()->comment('转向情况');
            $table->text('abnormal_noise')->nullable()->comment('异响情况');
            $table->text('other_issues')->nullable()->comment('其他问题');
            $table->integer('rating')->nullable()->comment('综合评分 1-5');
            $table->text('overall_evaluation')->nullable()->comment('综合评价');
            $table->foreignId('accompanied_by')->nullable()->constrained('users')->nullOnDelete()->comment('陪同人员');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_drives');
    }
};
