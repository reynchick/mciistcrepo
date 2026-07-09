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
        Schema::create('agendas', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('research_agenda', function (Blueprint $table) {
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->foreignId('agenda_id')->constrained('agendas')->cascadeOnDelete();
            $table->primary(['research_id', 'agenda_id']); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('research_agenda');
        Schema::dropIfExists('agendas');
    }
};