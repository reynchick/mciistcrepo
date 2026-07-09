<?php

namespace Database\Factories;

use App\Models\KeywordSearchLog;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Keyword;
use App\Models\User;

class KeywordSearchLogFactory extends Factory
{
    protected $model = KeywordSearchLog::class;

    public function definition(): array
    {
        return [
            'keyword_id' => function () {
                return Keyword::query()->inRandomOrder()->value('id');
            },
            'user_id' => function () {
                return User::query()->inRandomOrder()->value('id') ?? User::factory()->create()->id;
            },
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }
}
