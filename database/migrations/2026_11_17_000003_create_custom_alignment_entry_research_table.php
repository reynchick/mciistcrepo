<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Links custom alignment entries to research records. Nothing writes to this
     * table yet; it exists so usage counts work once research tagging is added.
     */
    public function up(): void
    {
        Schema::create('custom_alignment_entry_research', function (Blueprint $table) {
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->foreignId('custom_alignment_entry_id')->constrained('custom_alignment_entries')->cascadeOnDelete();
            $table->primary(['research_id', 'custom_alignment_entry_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_alignment_entry_research');
    }
};
