<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faculty_audit_logs', function (Blueprint $table) {
            $table->id();

            // Who performed the action
            $table->foreignId('modified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->index();

            // Target faculty
            $table->foreignId('target_faculty_id')
                ->nullable()
                ->constrained('faculties')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->index();
            
            // Action metadata
            $table->string('action_type', 100)->index(); // e.g., "create faculty", "update faculty"
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('metadata')->nullable(); // e.g., import source, validation notes
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();

            // Helpful compound indexes
            $table->index(['action_type', 'created_at']);
            $table->index(['modified_by', 'created_at']);
            $table->index(['target_faculty_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faculty_audit_logs');
    }
};