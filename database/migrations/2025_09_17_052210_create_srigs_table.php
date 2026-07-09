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
        Schema::create('srigs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });
        
        Schema::create('research_srig', function (Blueprint $table) {
            $table->foreignId('research_id')->constrained('researches')->onDelete('cascade');
            $table->foreignId('srig_id')->constrained('srigs')->onDelete('cascade');
            $table->primary(['research_id', 'srig_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_srig');
        Schema::dropIfExists('srigs');
    }
};
