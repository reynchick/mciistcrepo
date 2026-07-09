<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sdgs', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('research_sdg', function (Blueprint $table) {
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->foreignId('sdg_id')->constrained('sdgs')->cascadeOnDelete();
            $table->primary(['research_id', 'sdg_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_sdg');
        Schema::dropIfExists('sdgs');
    }
};