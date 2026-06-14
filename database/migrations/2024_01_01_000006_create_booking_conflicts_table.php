<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_conflicts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('trial_bookings')->cascadeOnDelete();
            $table->enum('conflict_type', [
                'capacity_full',
                'time_overlap',
                'student_duplicate',
                'phone_duplicate',
                'other'
            ])->comment('冲突类型：容量满/时间重叠/学员重复/手机号重复/其他');
            $table->text('conflict_description');
            $table->json('conflict_data')->nullable()->comment('冲突详情数据');
            $table->foreignId('related_booking_id')->nullable()->constrained('trial_bookings')->nullOnDelete();
            $table->boolean('resolved')->default(false);
            $table->text('resolution_note')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['booking_id', 'resolved']);
            $table->index(['conflict_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_conflicts');
    }
};
