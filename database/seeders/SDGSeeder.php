<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SDG;

class SDGSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sdgs = [
            ['name' => 'SDG1: No Poverty', 'description' => 'End poverty in all its forms everywhere.'],
            ['name' => 'SDG2: Zero Hunger', 'description' => 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture.'],
            ['name' => 'SDG3: Good Health and Well-Being', 'description' => 'Ensure healthy lives and promote well-being for all at all ages.'],
            ['name' => 'SDG4: Quality Education', 'description' => 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.'],
            ['name' => 'SDG5: Gender Equality', 'description' => 'Achieve gender equality and empower all women and girls.'],
            ['name' => 'SDG6: Clean Water and Sanitation', 'description' => 'Ensure availability and sustainable management of water and sanitation for all.'],
            ['name' => 'SDG7: Affordable and Clean Energy', 'description' => 'Ensure access to affordable, reliable, sustainable and modern energy for all.'],
            ['name' => 'SDG8: Decent Work and Economic Growth', 'description' => 'Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.'],
            ['name' => 'SDG9: Industry, Innovation and Infrastructure', 'description' => 'Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.'],
            ['name' => 'SDG10: Reduced Inequalities', 'description' => 'Reduce inequality within and among countries.'],
            ['name' => 'SDG11: Sustainable Cities and Communities', 'description' => 'Make cities and human settlements inclusive, safe, resilient and sustainable.'],
            ['name' => 'SDG12: Responsible Consumption and Production', 'description' => 'Ensure sustainable consumption and production patterns.'],
            ['name' => 'SDG13: Climate Action', 'description' => 'Take urgent action to combat climate change and its impacts.'],
            ['name' => 'SDG14: Life Below Water', 'description' => 'Conserve and sustainably use the oceans, seas and marine resources for sustainable development.'],
            ['name' => 'SDG15: Life on Land', 'description' => 'Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss.'],
            ['name' => 'SDG16: Peace, Justice and Strong Institutions', 'description' => 'Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels.'],
            ['name' => 'SDG17: Partnerships for the Goals', 'description' => 'Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development.'],
        ];

        foreach ($sdgs as $sdg) {
            SDG::firstOrCreate(['name' => $sdg['name']], ['description' => $sdg['description']]);
        }
    }
}