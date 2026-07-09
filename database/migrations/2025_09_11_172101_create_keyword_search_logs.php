<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keyword_search_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('keyword_id')
                ->nullable()
                ->constrained('keywords')
                ->cascadeOnDelete()
                ->cascadeOnUpdate()
                ->index();
            $table->string('search_term', 255)->nullable();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
    
            $table->index(['created_at']);
            $table->index(['search_term']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keyword_search_logs');
    }
};
