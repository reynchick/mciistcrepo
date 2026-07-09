<?php

namespace Database\Factories;

use App\Models\FacultyAuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Faculty;

class FacultyAuditLogFactory extends Factory
{
    protected $model = FacultyAuditLog::class;

    public function definition(): array
    {
        return [
            'modified_by' => function () {
                return User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id;
            },
            'target_faculty_id' => function () {
                return Faculty::query()->inRandomOrder()->value('id');
            },
            'action_type' => $this->faker->randomElement(array_keys(FacultyAuditLog::getActionTypes())),
            'old_values' => [
                'name' => $this->faker->company(),
                'code' => strtoupper($this->faker->bothify('F??')),
            ],
            'new_values' => [
                'name' => $this->faker->company(),
                'code' => strtoupper($this->faker->bothify('F??')),
            ],
            'metadata' => [
                'note' => $this->faker->sentence(),
            ],
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }
}
