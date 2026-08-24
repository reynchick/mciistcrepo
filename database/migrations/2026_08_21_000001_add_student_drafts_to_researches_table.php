<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add private per-student draft snapshots to installations where the
     * original researches migration has already been applied.
     */
    public function up(): void
    {
        if (Schema::hasColumn('researches', 'student_drafts')) {
            return;
        }

        Schema::table('researches', function (Blueprint $table): void {
            $table->json('student_drafts')->nullable();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('researches', 'student_drafts')) {
            return;
        }

        Schema::table('researches', function (Blueprint $table): void {
            $table->dropColumn('student_drafts');
        });
    }
};
