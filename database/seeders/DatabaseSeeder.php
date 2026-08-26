<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;
    
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            FacultySeeder::class,
            ProgramSeeder::class,
            AdminStaffSeeder::class,
            AgendaSeeder::class,
            SdgSeeder::class,
            SrigSeeder::class,
            ResearchSeeder::class,
            KeywordSeeder::class,
            ResearcherSeeder::class,
            ResearchKeywordSeeder::class,
            ResearchAgendaSeeder::class,
            ResearchSDGSeeder::class,
            ResearchSRIGSeeder::class,
            PostedResearchCompletenessSeeder::class,
            ReportTypeSeeder::class,
            ReportFormatSeeder::class,
        ]);
    }
}
