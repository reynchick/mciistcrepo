<?php

namespace Database\Seeders;

use App\Models\ReportType;
use Illuminate\Database\Seeder;

class ReportTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'name' => 'Abstract/Executive Summary Compilation',
                'description' => 'Compilation of research abstracts and executive summaries'
            ],
            [
                'name' => 'Tabular Report',
                'description' => 'Tabular representation of research data'
            ],
        ];

        foreach ($types as $type) {
            ReportType::create($type);
        }
    }
}