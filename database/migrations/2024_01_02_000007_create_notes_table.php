<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notable_id');
            $table->string('notable_type', 100);
            $table->unsignedTinyInteger('type')->default(1);
            $table->unsignedTinyInteger('priority')->default(2);
            $table->boolean('is_internal')->default(true);
            $table->text('content');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['notable_type', 'notable_id']);
            $table->index(['created_by', 'created_at']);
            $table->index(['is_internal', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
