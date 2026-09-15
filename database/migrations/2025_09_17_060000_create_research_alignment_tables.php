<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_alignment_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('research_alignment_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_alignment_category_id')->constrained('research_alignment_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['research_alignment_category_id', 'name'], 'research_alignment_entries_category_name_unique');
        });

        Schema::create('research_alignment_entry', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->foreignId('research_alignment_entry_id')->constrained('research_alignment_entries')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['research_id', 'research_alignment_entry_id'], 'research_alignment_entry_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_alignment_entry');
        Schema::dropIfExists('research_alignment_entries');
        Schema::dropIfExists('research_alignment_categories');
    }
};