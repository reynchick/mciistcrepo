<?php

namespace Database\Factories;

use App\Models\UserAuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;

class UserAuditLogFactory extends Factory
{
    protected $model = UserAuditLog::class;

    public function definition(): array
    {
        return [
            'modified_by' => function () {
                return User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id;
            },
            'target_user_id' => function () {
                return User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id;
            },
            'action_type' => $this->faker->randomElement(array_keys(UserAuditLog::getActionTypes())),
            'old_values' => [
                'name' => $this->faker->name(),
                'email' => $this->faker->unique()->safeEmail(),
            ],
            'new_values' => [
                'name' => $this->faker->name(),
                'email' => $this->faker->unique()->safeEmail(),
            ],
            'metadata' => [
                'reason' => $this->faker->sentence(),
            ],
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }
}
