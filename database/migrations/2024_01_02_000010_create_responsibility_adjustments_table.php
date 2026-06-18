<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('responsibility_adjustments', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('old_responsibility_role')->nullable();
            $table->unsignedTinyInteger('new_responsibility_role')->nullable();
            $table->foreignId('old_assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('new_assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->text('supplement_note')->nullable();
            $table->unsignedTinyInteger('status')->default(1);
            $table->string('impacted_areas', 500)->nullable();
            $table->foreignId('test_drive_id')->constrained()->restrictOnDelete();
            $table->foreignId('review_material_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('approved_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['test_drive_id', 'status']);
            $table->index(['submitted_by', 'created_at']);
            $table->index(['new_responsibility_role', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('responsibility_adjustments');
    }
};
