<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trial_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_no', 32)->unique()->comment('预约单号');
            $table->string('student_name');
            $table->integer('age')->nullable();
            $table->enum('gender', ['male', 'female', 'unknown'])->default('unknown');
            $table->string('parent_name')->nullable();
            $table->string('phone', 20);
            $table->string('source_channel')->nullable()->comment('来源渠道');
            $table->string('source_detail')->nullable()->comment('来源详情');

            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('time_slot_id')->constrained();
            $table->date('trial_date');

            $table->enum('status', [
                'pending',
                'confirmed',
                'need_info',
                'escalated',
                'completed',
                'cancelled',
                'closed'
            ])->default('pending')->index()->comment('待跟进/已确认/补资料/升级复核/已完成/已取消/已关闭');

            $table->text('remark')->nullable();
            $table->boolean('attended')->nullable()->comment('是否到场');
            $table->text('attendance_note')->nullable();

            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete()->comment('责任人');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamp('status_updated_at')->nullable();

            $table->json('review_tags')->nullable()->comment('复盘标签');
            $table->text('review_note')->nullable()->comment('复盘备注');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('reviewed_at')->nullable();

            $table->foreignId('escalated_to')->nullable()->constrained('users')->comment('升级复核人');
            $table->text('escalation_reason')->nullable();
            $table->timestamp('escalated_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['trial_date', 'time_slot_id']);
            $table->index(['status', 'assigned_to']);
            $table->index(['created_at', 'source_channel']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trial_bookings');
    }
};
