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
        Schema::create('panels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')
                ->constrained('researches')
                ->cascadeOnDelete()
                ->cascadeOnUpdate()
                ->index();
            $table->foreignId('faculty_id')
                ->constrained('faculties')
                ->cascadeOnDelete()
                ->cascadeOnUpdate()
                ->index();
            $table->timestamps();

            $table->unique(['research_id', 'faculty_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('panels');
    }
};
