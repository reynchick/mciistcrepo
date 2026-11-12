<?php

namespace Database\Factories;

use App\Models\Faculty;
use App\Models\Panel;
use App\Models\Research;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Panel>
 */
class PanelFactory extends Factory
{
    protected $model = Panel::class;

    public function definition(): array
    {
        return [
            'research_id' => Research::query()->inRandomOrder()->value('id'),
            'faculty_id' => Faculty::query()->inRandomOrder()->value('id'),
        ];
    }
}
