<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('research_metadata_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('research_id')
                ->constrained('researches')
                ->cascadeOnDelete();
            $table->string('term', 50);
            $table->text('value');
            $table->string('scheme', 255)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['research_id', 'term']);
        });

        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared(<<<'SQL'
                CREATE TRIGGER research_metadata_values_reject_derived_insert
                BEFORE INSERT ON research_metadata_values
                FOR EACH ROW
                WHEN lower(trim(NEW.term)) IN ('title', 'creator', 'date')
                BEGIN
                    SELECT RAISE(ABORT, 'Title, Creator, and Date are derived from core research fields');
                END
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER research_metadata_values_reject_derived_update
                BEFORE UPDATE OF term ON research_metadata_values
                FOR EACH ROW
                WHEN lower(trim(NEW.term)) IN ('title', 'creator', 'date')
                BEGIN
                    SELECT RAISE(ABORT, 'Title, Creator, and Date are derived from core research fields');
                END
            SQL);
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::unprepared('DROP TRIGGER IF EXISTS research_metadata_values_reject_derived_insert');
            DB::unprepared('DROP TRIGGER IF EXISTS research_metadata_values_reject_derived_update');
        }

        Schema::dropIfExists('research_metadata_values');
    }
};
