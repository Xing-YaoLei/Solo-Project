<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timeline_review_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timeline_id')->constrained()->restrictOnDelete();
            $table->foreignId('review_material_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('relation_type')->default(1);
            $table->text('relation_note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['timeline_id', 'review_material_id', 'relation_type'], 'tl_rev_unique_rel');
            $table->index(['review_material_id', 'relation_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timeline_review_links');
    }
};
