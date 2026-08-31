<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration:
     * 1. Removes the student_profile_completed field (no longer needed - students must be pre-approved)
     * 2. Adds student access approval fields to track admin-approved student records
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove the student profile completion field
            $table->dropColumn('student_profile_completed');
            
            // Add student access approval tracking fields
            // When a student record is created/approved by admin, access_approved is set to true
            $table->boolean('student_access_approved')->default(false)->after('student_id')
                ->comment('Whether this student account has been approved by administrator for system access');
            $table->timestamp('student_access_approved_at')->nullable()->after('student_access_approved')
                ->comment('Timestamp when student access was approved by administrator');
            $table->timestamp('student_access_revoked_at')->nullable()->after('student_access_approved_at')
                ->comment('Timestamp when student access was revoked by administrator (deactivation)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore the student_profile_completed field
            $table->boolean('student_profile_completed')->nullable()
                ->comment('Whether the student profile has been completed; null if not currently student');
            
            // Drop the new student access fields
            $table->dropColumn('student_access_approved');
            $table->dropColumn('student_access_approved_at');
            $table->dropColumn('student_access_revoked_at');
        });
    }
};
