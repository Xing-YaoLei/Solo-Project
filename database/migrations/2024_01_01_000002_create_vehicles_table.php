<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vin', 50)->unique()->comment('车架号');
            $table->string('plate_no', 20)->nullable()->comment('车牌号');
            $table->string('brand', 100)->comment('品牌');
            $table->string('model', 100)->comment('型号');
            $table->string('year', 10)->comment('年款');
            $table->string('color', 30)->nullable();
            $table->integer('mileage')->default(0)->comment('里程数(公里)');
            $table->date('first_register_date')->nullable()->comment('首次上牌日期');
            $table->string('displacement', 20)->nullable()->comment('排量');
            $table->string('transmission', 20)->nullable()->comment('变速箱');
            $table->string('fuel_type', 20)->nullable()->comment('燃油类型');
            $table->decimal('purchase_price', 12, 2)->nullable()->comment('收购价');
            $table->decimal('expected_sale_price', 12, 2)->nullable()->comment('预期售价');
            $table->decimal('actual_sale_price', 12, 2)->nullable()->comment('实际售价');
            $table->string('status', 30)->default('pending')->comment('状态: pending评估中, preparing整备中, available在库, sold已售, cancelled取消');
            $table->string('source', 50)->nullable()->comment('车源渠道');
            $table->string('owner_name', 50)->nullable()->comment('原车主姓名');
            $table->string('owner_phone', 20)->nullable()->comment('原车主电话');
            $table->text('remark')->nullable();
            $table->foreignId('appraiser_id')->nullable()->constrained('users')->nullOnDelete()->comment('评估师');
            $table->foreignId('sales_id')->nullable()->constrained('users')->nullOnDelete()->comment('负责销售');
            $table->foreignId('created_by')->constrained('users');
            $table->date('arrival_date')->nullable()->comment('到店日期');
            $table->date('sold_date')->nullable()->comment('售出日期');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'created_at']);
            $table->index(['brand', 'model']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
