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
        Schema::create('faculties', function (Blueprint $table) {
            $table->id();
            $table->string('faculty_id')->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('position')->nullable();
            $table->string('designation')->nullable();
            $table->string('email')->nullable()->unique()->where('email', 'LIKE', '%@usep.edu.ph');
            $table->string('orcid')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('educational_attainment')->nullable();
            $table->text('field_of_specialization')->nullable();
            $table->text('research_interest')->nullable();
            $table->string('profile_picture')->nullable()->comment('Path to faculty profile picture');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('faculties');
    }
};
