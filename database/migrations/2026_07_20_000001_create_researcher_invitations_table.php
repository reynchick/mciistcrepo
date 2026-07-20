<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('researcher_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('researcher_id')->constrained('researchers')->cascadeOnDelete();
            $table->string('token_hash')->unique();
            $table->string('email_snapshot');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('researcher_invitations');
    }
};
