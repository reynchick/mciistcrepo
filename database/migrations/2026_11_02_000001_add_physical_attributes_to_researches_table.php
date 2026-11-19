<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('researches', function (Blueprint $table): void {
            $table->json('physical_attributes')->nullable()->after('research_manuscript');
        });
    }

    public function down(): void
    {
        Schema::table('researches', function (Blueprint $table): void {
            $table->dropColumn('physical_attributes');
        });
    }
};
