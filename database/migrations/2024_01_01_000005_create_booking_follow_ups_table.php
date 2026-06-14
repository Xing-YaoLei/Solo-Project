<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('trial_bookings')->cascadeOnDelete();
            $table->enum('type', ['call', 'wechat', 'visit', 'other'])->default('call')->comment('跟进方式');
            $table->text('content');
            $table->timestamp('follow_up_at');
            $table->timestamp('next_follow_up_at')->nullable();
            $table->string('next_action')->nullable();
            $table->enum('result', ['interested', 'pending', 'not_interested', 'need_info', 'escalated'])->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['booking_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_follow_ups');
    }
};
