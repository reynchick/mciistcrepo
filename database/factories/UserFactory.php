<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker     = $this->faker;
        $localPart = Str::lower(Str::slug($faker->unique()->userName()));
        $email     = $localPart . '@usep.edu.ph';

        return [
            'student_id'        => null,
            'faculty_id'        => null,
            'first_name'        => $faker->firstName(),
            'middle_name'       => $faker->optional()->randomLetter() . '.',
            'last_name'         => $faker->lastName(),
            'contact_number'    => $faker->optional()->regexify('09\d{9}'),
            'email'             => $email,
            'email_verified_at' => null,
            'password'          => static::$password ??= Hash::make('password'),
            'remember_token'    => Str::random(10),
            'first_login_completed' => false,
            'created_by_admin'   => false,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the user's email has already been verified.
     */
    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Create an account that was provisioned by an administrator.
     */
    public function adminCreated(): static
    {
        return $this->state(fn (array $attributes) => [
            'password' => null,
            'email_verified_at' => null,
            'first_login_completed' => false,
            'created_by_admin' => true,
        ]);
    }

    /**
     * Attach a random default role after creating the user.
     */
    public function withRole(): static
    {
        return $this->afterCreating(function (\App\Models\User $user) {
            $this->ensureRoleExists();
            $roleId = Role::whereIn('name', $this->defaultRoles())
                ->inRandomOrder()
                ->value('id');

            if ($roleId) {
                $user->roles()->syncWithoutDetaching([$roleId]);
            }
        });
    }

    /**
     * Create user without automatically attaching a role (default behavior).
     */
    public function withoutRoles(): static
    {
        return $this;
    }

    /**
     * Create user with Administrator role.
     */
    public function asAdministrator(): static
    {
        return $this->afterCreating(function (\App\Models\User $user) {
            $role = Role::firstOrCreate(['name' => 'Administrator'], ['description' => 'Administrator']);
            $user->roles()->sync([$role->id]);
        });
    }

    /**
     * Create user with Faculty role.
     */
    public function asFaculty(): static
    {
        return $this->afterCreating(function (\App\Models\User $user) {
            $role = Role::firstOrCreate(['name' => 'Faculty'], ['description' => 'Faculty']);
            $user->roles()->sync([$role->id]);
        });
    }

    /**
     * Create user with Student role.
     */
    public function asStudent(): static
    {
        $faker = $this->faker;

        return $this->afterCreating(function (\App\Models\User $user) {
            $role = Role::firstOrCreate(['name' => 'Student'], ['description' => 'Student']);
            $user->roles()->sync([$role->id]);
        })->state(function (array $attributes) use ($faker) {
            return [
                'student_id' => $faker->numberBetween(2015, (int) now()->year) . '-' . str_pad((string) $faker->numberBetween(0, 99999), 5, '0', STR_PAD_LEFT),
            ];
        });
    }

    /**
     * Create user with MCIIS Staff role.
     */
    public function asMCIISStaff(): static
    {
        return $this->afterCreating(function (\App\Models\User $user) {
            $role = Role::firstOrCreate(['name' => 'MCIIS Staff'], ['description' => 'MCIIS Staff']);
            $user->roles()->sync([$role->id]);
        });
    }

    private function defaultRoles(): array
    {
        return ['Administrator', 'MCIIS Staff', 'Faculty', 'Student'];
    }

    private function ensureRoleExists(): Role
    {
        $roles = $this->defaultRoles();

        foreach ($roles as $name) {
            Role::firstOrCreate(['name' => $name], ['description' => $name]);
        }

        return Role::whereIn('name', $roles)->inRandomOrder()->first();
    }
}

