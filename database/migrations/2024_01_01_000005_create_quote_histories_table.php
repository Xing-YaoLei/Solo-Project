<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quote_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->decimal('quote_price', 12, 2)->comment('报价金额');
            $table->decimal('counter_offer', 12, 2)->nullable()->comment('还价金额');
            $table->decimal('final_price', 12, 2)->nullable()->comment('最终成交价');
            $table->string('stage', 30)->default('initial')->comment('阶段: initial初次, negotiation议价, final最终');
            $table->text('negotiation_notes')->nullable()->comment('议价记录');
            $table->string('status', 30)->default('pending')->comment('pending待确认, accepted接受, rejected拒绝, countered还价');
            $table->dateTime('responded_at')->nullable();
            $table->foreignId('quoted_by')->constrained('users')->comment('报价人');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->comment('审批人');
            $table->text('remark')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_histories');
    }
};
