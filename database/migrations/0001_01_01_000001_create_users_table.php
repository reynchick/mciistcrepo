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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('student_id')->nullable()->comment('Student ID for student roles')->unique();
            $table->string('faculty_id')->nullable()->comment('Faculty ID for faculty roles')->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('contact_number')->nullable();
            $table->string('email')->unique()->where('email', 'LIKE', '%@usep.edu.ph');
            $table->string('password')->nullable()->comment('Password hash - nullable for SSO-only accounts');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('google_id')->nullable()->unique()->comment('Google OAuth ID for SSO');
            $table->string('avatar')->nullable()->comment('User avatar from Google');
            $table->boolean('faculty_profile_completed')->nullable()->comment('Whether the faculty profile has been completed; null if not currently faculty');
            $table->boolean('student_profile_completed')->nullable()->comment('Whether the student profile has been completed; null if not currently student');
            $table->boolean('first_login_completed')->default(false)->comment('Whether user has logged in at least once');
            $table->boolean('created_by_admin')->default(false)->comment('Whether account was created by administrator (true) or via Google SSO self-registration (false)');
            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'role_id']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->string('password');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_user');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
