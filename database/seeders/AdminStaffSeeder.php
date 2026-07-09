<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Database\Seeder;

class AdminStaffSeeder extends Seeder
{
    /**
     * Pre-create admin/staff accounts for Google SSO.
     * 
     * These accounts have NO passwords - they can ONLY log in via Google SSO.
     * When they log in with Google for the first time:
     * - google_id and avatar will be populated automatically by GoogleAuthController
     * - first_login_completed will be set to true
     * - They will be redirected to complete their profile (profile_completed = false)
     */
    public function run(): void
    {
        // Create all roles
        $adminRole = Role::firstOrCreate(['name' => 'Administrator']);
        $staffRole = Role::firstOrCreate(['name' => 'MCIIS Staff']);
        $facultyRole = Role::firstOrCreate(['name' => 'Faculty']);
        $studentRole = Role::firstOrCreate(['name' => 'Student']);

        $users = [
            [
                'first_name' => 'Elah Marvinelie',
                'middle_name' => 'D.',
                'last_name' => 'Menil',
                'contact_number' => '09123456789',
                'email' => 'jmmlurzano00587@usep.edu.ph',
                'role_id' => $adminRole->id,
            ],
            [
                'first_name' => 'Gloren Joy',
                'middle_name' => 'E.',
                'last_name' => 'Roque',
                'contact_number' => '09987654321',
                'email' => 'gjjeroque00800@usep.edu.ph',
                'role_id' => $staffRole->id,
            ],
        ];

        foreach ($users as $data) {
            $roleId = $data['role_id'];
            unset($data['role_id']);
            
            // Set metadata for admin-created account audit log
            UserObserver::$customMetadata = ['source' => 'admin_created'];
            
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    ...$data,
                    'student_id' => null,
                    'faculty_id' => null,
                    'password' => null, // No password - Google SSO only
                    'google_id' => null, // Will be set on first Google login
                    'avatar' => null, // Will be set on first Google login
                    'created_by_admin' => true, // These accounts are provisioned by the system admin
                    'profile_completed' => false, // Will be set after user completes profile
                    'first_login_completed' => false, // Will be set on first Google login
                    'email_verified_at' => null, // Will be set on first Google login
                ],
            );
            
            // Attach role using pivot table
            $user->roles()->syncWithoutDetaching([$roleId]);
        }
    }
}
