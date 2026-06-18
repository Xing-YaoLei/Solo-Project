<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50)->comment('资料类型: registration行驶证, vehicle_cert车辆登记证, purchase_invoice购车发票, insurance保险单, inspection_report检测报告, maintenance_record保养记录, other其他');
            $table->string('title', 200)->comment('资料标题');
            $table->string('reference_no', 100)->nullable()->comment('参考编号');
            $table->date('issue_date')->nullable()->comment('签发日期');
            $table->date('expire_date')->nullable()->comment('到期日期');
            $table->string('status', 30)->default('received')->comment('received已收到, verified已核验, missing缺失, expired过期');
            $table->text('verification_notes')->nullable()->comment('核验说明');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete()->comment('核验人');
            $table->dateTime('verified_at')->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_documents');
    }
};
