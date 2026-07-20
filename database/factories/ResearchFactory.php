<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Agenda;
use App\Models\Sdg;
use App\Models\Srig;
use App\Models\Research;
use App\Models\Faculty;
use App\Models\Keyword;
use App\Models\Researcher;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Research>
 */
class ResearchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = $this->faker ?? \Faker\Factory::create();
        $program = Program::query()->inRandomOrder()->first();

        return [
            'uploaded_by'             => User::factory(),
            'research_title'          => $faker->unique()->sentence(6),
            'research_adviser'        => null,
            'program_id'              => $program?->id ?? Program::factory()->create()->id,
            'published_month'         => $faker->optional()->numberBetween(1, 12),
            'published_year'          => $faker->numberBetween(2015, (int) now()->year),
            'research_abstract'       => $faker->paragraphs(nb: 3, asText: true),
            'research_approval_sheet' => null,
            'research_manuscript'     => null,
            'status'                  => config('research.defaults.create', 'draft'),
            'entry_mode'              => 'faculty_student',
            'submitted_at'            => null,
            'published_at'            => null,
            'archived_at'             => null,
            'archived_by'             => null,
            'archive_reason'          => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'entry_mode' => 'staff_direct_publish',
            'submitted_at' => now()->subMinutes(5),
            'published_at' => now(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => 'draft',
            'entry_mode' => 'faculty_student',
            'submitted_at' => null,
            'published_at' => null,
        ]);
    }

    public function staffDirectPublish(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'entry_mode' => 'staff_direct_publish',
            'submitted_at' => now()->subMinutes(10),
            'published_at' => now(),
        ]);
    }

    public function staffFacultyCompletion(): static
    {
        return $this->state(fn () => [
            'status' => 'submitted',
            'entry_mode' => 'faculty_student',
            'submitted_at' => now()->subMinutes(15),
            'published_at' => null,
        ]);
    }

    public function configure(): static
    {
        $faker = $this->faker ?? \Faker\Factory::create();

        return $this->afterCreating(function (Research $research) use ($faker) {
            $now = Carbon::now();

            $agendas = Agenda::query()->inRandomOrder()->limit(random_int(1, 3))->pluck('id')->all();
            $sdgs = Sdg::query()->inRandomOrder()->limit(random_int(1, 3))->pluck('id')->all();
            $srigs = Srig::query()->inRandomOrder()->limit(random_int(1, 3))->pluck('id')->all();
            $panelists = Faculty::query()->inRandomOrder()->limit(random_int(1, 3))->pluck('id')->all();
            $keywords = Keyword::query()->inRandomOrder()->limit(random_int(2, 6))->pluck('id')->all();

            $map = function (array $ids) use ($now) {
                return collect($ids)->mapWithKeys(fn ($id) => [$id => ['created_at' => $now, 'updated_at' => $now]])->all();
            };

            $research->agendas()->syncWithoutDetaching($map($agendas));
            $research->sdgs()->syncWithoutDetaching($map($sdgs));
            $research->srigs()->syncWithoutDetaching($map($srigs));
            $research->panelists()->syncWithoutDetaching($map($panelists));
            $research->keywords()->syncWithoutDetaching($map($keywords));

            $count = random_int(1, 3);
            for ($i = 0; $i < $count; $i++) {
                Researcher::create([
                    'research_id' => $research->id,
                    'first_name' => $faker->firstName(),
                    'middle_name' => $faker->optional()->firstName(),
                    'last_name' => $faker->lastName(),
                    'email' => $faker->boolean(80) ? $faker->unique()->safeEmail() : null,
                ]);
            }
        });
    }
}


