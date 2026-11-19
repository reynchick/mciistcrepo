<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('researches')) {
            return;
        }

        DB::table('researches')
            ->whereIn('status', ['submitted', 'returned'])
            ->update(['status' => 'draft']);

        if (Schema::hasColumn('researches', 'submitted_at')) {
            Schema::table('researches', function (Blueprint $table): void {
                $table->dropColumn('submitted_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('researches') && ! Schema::hasColumn('researches', 'submitted_at')) {
            Schema::table('researches', function (Blueprint $table): void {
                $table->timestamp('submitted_at')->nullable();
            });
        }
    }
};
