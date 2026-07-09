<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keywords', function (Blueprint $table) {
            $table->id();
            $table->string('keyword_name')->unique();
            $table->timestamps();
        });

        Schema::create('research_keywords', function (Blueprint $table) {
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->foreignId('keyword_id')->constrained('keywords')->cascadeOnDelete();
            $table->primary(['research_id', 'keyword_id']); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_keywords');
        Schema::dropIfExists('keywords');
    }
};
