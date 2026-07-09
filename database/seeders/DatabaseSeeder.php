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
            ReportTypeSeeder::class,
            ReportFormatSeeder::class,
        ]);
        
        // Base research sample data
        \App\Models\Research::factory()->count(10)->create();

        // Generate assorted log/audit entries for activity simulation
        \App\Models\UserAuditLog::factory()->count(15)->create();
        \App\Models\FacultyAuditLog::factory()->count(15)->create();
        \App\Models\ResearchAccessLog::factory()->count(30)->create();
        \App\Models\KeywordSearchLog::factory()->count(25)->create();
        \App\Models\ResearchEntryLog::factory()->count(20)->create();
    }
}
