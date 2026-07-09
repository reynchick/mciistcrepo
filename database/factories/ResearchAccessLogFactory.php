<?php

namespace Database\Factories;

use App\Models\ResearchAccessLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Research;
use App\Models\User;

class ResearchAccessLogFactory extends Factory
{
    protected $model = ResearchAccessLog::class;

    public function definition(): array
    {
        return [
            'research_id' => function () {
                return Research::query()->inRandomOrder()->value('id') ?? Research::factory()->create()->id;
            },
            'user_id' => function () {
                // 80% chance authenticated user, else null
                if ($this->faker->boolean(80)) {
                    return User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id;
                }
                return null;
            },
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }
}
