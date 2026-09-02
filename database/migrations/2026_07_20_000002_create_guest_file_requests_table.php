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
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete()->index();
            $table->string('guest_session_id')->nullable()->index();
            $table->foreignId('guest_user_id')->nullable()->constrained('users')->nullOnDelete()->index();
            $table->string('file_type')->index();
            $table->string('status')->default('requested')->index();
            $table->string('approval_policy')->default('adviser_final');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('escalated_at')->nullable();
            $table->timestamp('lead_approved_at')->nullable();
            $table->foreignId('lead_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('lead_email_status')->nullable();
            $table->timestamp('lead_email_sent_at')->nullable();
            $table->text('lead_email_error')->nullable();
            $table->timestamp('adviser_approved_at')->nullable();
            $table->foreignId('adviser_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('adviser_email_status')->nullable();
            $table->timestamp('adviser_email_sent_at')->nullable();
            $table->text('adviser_email_error')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('guest_file_request_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('guest_file_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event');
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('guest_file_request_tokens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('guest_file_request_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_role');
            $table->string('token_hash')->unique();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['guest_file_request_id', 'recipient_role']);
        });

        Schema::create('guest_file_request_access_grants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('guest_file_request_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('guest_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->string('file_type');
            $table->timestamp('granted_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['guest_user_id', 'research_id', 'file_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_file_request_access_grants');
        Schema::dropIfExists('guest_file_request_tokens');
        Schema::dropIfExists('guest_file_request_events');
        Schema::dropIfExists('guest_file_requests');
    }
};
