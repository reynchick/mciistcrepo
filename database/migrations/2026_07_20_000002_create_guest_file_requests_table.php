<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_file_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->string('guest_session_id')->nullable()->index();
            $table->foreignId('guest_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('file_type');
            $table->string('status')->default('requested');
            $table->timestamp('lead_approved_at')->nullable();
            $table->timestamp('adviser_approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_file_requests');
    }
};
