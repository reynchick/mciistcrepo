<?php

namespace Database\Seeders;

use App\Models\ResearchAlignmentCategory;
use App\Models\ResearchAlignmentEntry;
use Illuminate\Database\Seeder;

class ResearchAlignmentSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'Agenda' => [
                'AGENDA1: Digital Transformation',
                'AGENDA2: Climate Change and Environmental Sustainability',
                'AGENDA3: Health and Wellness',
                'AGENDA4: Educational Innovation',
                'AGENDA5: Community Development and Social Inclusion',
                'AGENDA6: Disaster Risk Reduction and Management',
            ],
            'SDG' => [
                'SDG1: No Poverty',
                'SDG2: Zero Hunger',
                'SDG3: Good Health and Well-Being',
                'SDG4: Quality Education',
                'SDG11: Sustainable Cities and Communities',
                'SDG12: Responsible Consumption and Production',
            ],
            'SRIG' => [
                'SRIG1: Artificial Intelligence & Machine Learning',
                'SRIG2: Sustainable Agriculture',
                'SRIG3: Sustainable Agriculture and Food Systems',
                'SRIG6: Climate Change and Environmental Science',
                'SRIG7: Education Technology and Pedagogy',
                'SRIG13: Healthcare Innovation and Medical Technology',
            ],
        ];

        foreach ($defaults as $categoryName => $entryNames) {
            $category = ResearchAlignmentCategory::query()->firstOrCreate([
                'name' => $categoryName,
            ], [
                'description' => 'Default system alignment category for '.$categoryName.'.',
            ]);

            foreach ($entryNames as $entryName) {
                ResearchAlignmentEntry::query()->firstOrCreate([
                    'research_alignment_category_id' => $category->id,
                    'name' => $entryName,
                ]);
            }
        }
    }
}