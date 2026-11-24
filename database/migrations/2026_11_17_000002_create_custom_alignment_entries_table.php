<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_alignment_entries', function (Blueprint $table) {
            $table->id();
            // Restrict: a category can only be deleted once it is empty.
            $table->foreignId('custom_alignment_category_id')
                ->constrained('custom_alignment_categories')
                ->restrictOnDelete();
            // Same shape as the built-in SDG/SRIG/Agenda entries: "Name / code" + description.
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['custom_alignment_category_id', 'name'], 'custom_alignment_entries_category_name_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_alignment_entries');
    }
};
