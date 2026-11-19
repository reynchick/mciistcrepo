<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_metadata_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('research_id')
                ->constrained('researches')
                ->cascadeOnDelete();
            $table->string('term', 50);
            $table->text('value');
            $table->string('scheme', 100)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['research_id', 'term']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('research_metadata_values');
    }
};
