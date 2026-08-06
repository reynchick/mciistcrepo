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
        Schema::create('researches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->cascadeOnDelete()
                ->index();
            $table->string('research_title')->unique();
            $table->foreignId('research_adviser')
                ->nullable()
                ->constrained('faculties')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->index();
            $table->foreignId('program_id')
                ->constrained('programs')
                ->restrictOnDelete()
                ->cascadeOnUpdate()
                ->index();
            $table->unsignedTinyInteger('completed_month')->nullable();
            $table->unsignedSmallInteger('completed_year');
            $table->text('research_abstract');
            $table->string('research_approval_sheet')->nullable(); // image path
            $table->string('research_manuscript')->nullable();     // pdf path
            $table->string('status', 50)->default('draft')->index();
            $table->boolean('student_collaboration_enabled')->default(true)->after('status');
            $table->timestamp('manuscript_unavailable_legacy_at')->nullable();
            $table->foreignId('manuscript_unavailable_legacy_by')->nullable()->constrained('users')->nullOnDelete()->cascadeOnUpdate()->index();
            $table->timestamp('approval_sheet_unavailable_legacy_at')->nullable();
            $table->foreignId('approval_sheet_unavailable_legacy_by')->nullable()->constrained('users')->nullOnDelete()->cascadeOnUpdate()->index();
            $table->timestamp('panelists_unavailable_legacy_at')->nullable();
            $table->foreignId('panelists_unavailable_legacy_by')->nullable()->constrained('users')->nullOnDelete()->cascadeOnUpdate()->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->foreignId('archived_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate()
                ->index();
            $table->text('archive_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('researches');
    }
};
