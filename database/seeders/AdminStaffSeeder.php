<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use App\Observers\UserObserver;
use Illuminate\Database\Seeder;
use InvalidArgumentException;

class AdminStaffSeeder extends Seeder
{
    /**
     * Pre-create admin/staff accounts for Google SSO.
     *
     * These accounts have NO passwords - they can ONLY log in via Google SSO.
     * When they log in with Google for the first time:
     * - google_id and avatar will be populated automatically by GoogleAuthController
     * - first_login_completed will be set to true
     * - They will be redirected to complete their profile once the relevant role-specific completion flag is still pending
     */
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['name' => 'Administrator']);
        $staffRole = Role::firstOrCreate(['name' => 'MCIIS Staff']);
        Role::firstOrCreate(['name' => 'Faculty']);
        Role::firstOrCreate(['name' => 'Student']);

        $this->seedAccount(config('bootstrap-users.administrator', []), $adminRole);
        $this->seedAccount(config('bootstrap-users.staff', []), $staffRole);
    }

    /**
     * @param array{
     *     email?: string|null,
     *     lookup_email?: string|null,
     *     first_name?: string|null,
     *     middle_name?: string|null,
     *     last_name?: string|null,
     *     contact_number?: string|null
     * } $account
     */
    private function seedAccount(array $account, Role $role): void
    {
        $email = strtolower(trim((string) ($account['email'] ?? '')));
        $lookupEmail = strtolower(trim((string) ($account['lookup_email'] ?? '')));

        if ($email === '') {
            if ($lookupEmail !== '') {
                throw new InvalidArgumentException("Bootstrap {$role->name} lookup email is set, but its target email is empty.");
            }

            $this->command?->warn("Skipping bootstrap {$role->name} account; its email is not configured.");

            return;
        }

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || ! str_ends_with($email, '@usep.edu.ph')) {
            throw new InvalidArgumentException("Bootstrap {$role->name} email must be a valid @usep.edu.ph address.");
        }

        $firstName = trim((string) ($account['first_name'] ?? ''));
        $lastName = trim((string) ($account['last_name'] ?? ''));
        if ($firstName === '' || $lastName === '') {
            throw new InvalidArgumentException("Bootstrap {$role->name} account requires a first name and last name.");
        }

        $user = $lookupEmail !== ''
            ? User::query()->where('email', $lookupEmail)->first() ?? new User
            : User::query()->where('email', $email)->first() ?? new User;
        $isNew = ! $user->exists;
        $emailChanged = ! $isNew && strcasecmp((string) $user->email, $email) !== 0;

        $emailInUse = User::query()
            ->where('email', $email)
            ->when($user->exists, fn ($query) => $query->whereKeyNot($user->getKey()))
            ->exists();
        if ($emailInUse) {
            throw new InvalidArgumentException("Bootstrap {$role->name} target email is already assigned to another user.");
        }

        UserObserver::$customMetadata = ['source' => 'admin_created'];
        $user->fill([
            'first_name' => $firstName,
            'middle_name' => trim((string) ($account['middle_name'] ?? '')) ?: null,
            'last_name' => $lastName,
            'contact_number' => trim((string) ($account['contact_number'] ?? '')) ?: null,
            'email' => $email,
            'created_by_admin' => true,
        ]);

        if ($isNew || $emailChanged) {
            $user->forceFill([
                'student_id' => null,
                'faculty_id' => null,
                'password' => null,
                'google_id' => null,
                'avatar' => null,
                'first_login_completed' => false,
                'email_verified_at' => null,
            ]);
        }

        $user->save();
        $user->roles()->syncWithoutDetaching([$role->id]);
    }
}
