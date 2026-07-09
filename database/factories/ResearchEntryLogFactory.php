<?php

namespace Database\Factories;

use App\Models\ResearchEntryLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Research;

class ResearchEntryLogFactory extends Factory
{
    protected $model = ResearchEntryLog::class;

    public function definition(): array
    {
        return [
            'modified_by' => function () {
                return User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id;
            },
            'target_research_id' => function () {
                return Research::query()->inRandomOrder()->value('id') ?? Research::factory()->create()->id;
            },
            'action_type' => $this->faker->randomElement(array_keys(ResearchEntryLog::getActionTypes())),
            'old_values' => [
                'title' => $this->faker->sentence(4),
                'year' => $this->faker->year(),
            ],
            'new_values' => [
                'title' => $this->faker->sentence(5),
                'year' => $this->faker->year(),
            ],
            'metadata' => [
                'remarks' => $this->faker->sentence(),
            ],
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }
}
