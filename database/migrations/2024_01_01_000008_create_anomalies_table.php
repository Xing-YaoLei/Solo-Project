<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('anomalies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50)->comment('异常类型: missing_doc资料缺失, damage_dispute车况争议, price_dispute价格争议, legal_risk法律风险, other其他');
            $table->string('title', 200)->comment('异常标题');
            $table->text('description')->comment('异常描述');
            $table->string('severity', 20)->default('normal')->comment('严重程度: low低, normal中, high高, critical严重');
            $table->string('status', 30)->default('open')->comment('open待处理, in_progress处理中, resolved已解决, escalated已升级, closed已关闭');
            $table->text('resolution')->nullable()->comment('解决方案');
            $table->text('conclusion')->nullable()->comment('处理结论');
            $table->string('source', 50)->nullable()->comment('来源: system系统, appraiser评估师, sales销售, finance金融, manager店长, customer客户');
            $table->dateTime('resolved_at')->nullable();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete()->comment('上报人');
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete()->comment('处理人');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->comment('审批人');
            $table->json('before_snapshot')->nullable()->comment('处理前快照');
            $table->json('after_snapshot')->nullable()->comment('处理后快照');
            $table->timestamps();
            $table->index(['status', 'severity']);
            $table->index(['vehicle_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('anomalies');
    }
};
