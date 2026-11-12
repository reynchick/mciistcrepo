<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = array_values(array_filter(
            ['student_collaboration_enabled', 'student_drafts'],
            fn (string $column): bool => Schema::hasColumn('researches', $column),
        ));

        if ($columns !== []) {
            Schema::table('researches', function (Blueprint $table) use ($columns): void {
                $table->dropColumn($columns);
            });
        }
    }

    public function down(): void
    {
        Schema::table('researches', function (Blueprint $table): void {
            if (! Schema::hasColumn('researches', 'student_collaboration_enabled')) {
                $table->boolean('student_collaboration_enabled')->default(true);
            }

            if (! Schema::hasColumn('researches', 'student_drafts')) {
                $table->json('student_drafts')->nullable();
            }
        });
    }
};
