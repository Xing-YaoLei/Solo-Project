<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timelines', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('timelineable_id');
            $table->string('timelineable_type', 100);
            $table->unsignedTinyInteger('category')->default(1);
            $table->unsignedTinyInteger('action_type')->default(1);
            $table->string('action_name', 100);
            $table->string('field_name', 100)->nullable();
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->text('content')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('device_type', 20)->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['timelineable_type', 'timelineable_id', 'created_at'], 'timelines_subject_created_index');
            $table->index(['user_id', 'created_at']);
            $table->index(['category', 'action_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timelines');
    }
};
