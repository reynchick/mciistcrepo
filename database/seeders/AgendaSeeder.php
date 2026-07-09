<?php

namespace Database\Seeders;

use App\Models\Agenda;
use Illuminate\Database\Seeder;

class AgendaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $agendas = [
            [
                'name' => 'AGENDA1: Digital Transformation',
                'description' => 'Research on digital technologies and their impact on education and society',
            ],
            [
                'name' => 'AGENDA2: Climate Change and Environmental Sustainability',
                'description' => 'Studies on climate change mitigation, adaptation, and environmental conservation',
            ],
            [
                'name' => 'AGENDA3: Health and Wellness',
                'description' => 'Research focusing on public health, disease prevention, and wellness programs',
            ],
            [
                'name' => 'AGENDA4: Educational Innovation',
                'description' => 'Studies on innovative teaching methods, curriculum development, and learning outcomes',
            ],
            [
                'name' => 'AGENDA5: Community Development and Social Inclusion',
                'description' => 'Research on community empowerment, poverty reduction, and social equity',
            ],
            [
                'name' => 'AGENDA6: Disaster Risk Reduction and Management',
                'description' => 'Studies on disaster preparedness, response, and resilience building',
            ],
            [
                'name' => 'AGENDA7: Economic Development and Entrepreneurship',
                'description' => 'Research on sustainable economic growth, business innovation, and entrepreneurship',
            ],
            [
                'name' => 'AGENDA8: Food Security and Nutrition',
                'description' => 'Studies on agricultural productivity, food systems, and nutritional well-being',
            ],
            [
                'name' => 'AGENDA9: Cultural Heritage and Indigenous Knowledge',
                'description' => 'Research on preserving cultural heritage and integrating indigenous knowledge systems',
            ],
            [
                'name' => 'AGENDA10: Governance and Policy Development',
                'description' => 'Studies on effective governance, policy analysis, and institutional development',
            ],
            [
                'name' => 'AGENDA11: Energy Transition and Renewable Resources',
                'description' => 'Research on renewable energy technologies and sustainable energy systems',
            ],
            [
                'name' => 'AGENDA12: Urban Planning and Smart Cities',
                'description' => 'Studies on sustainable urban development and smart city technologies',
            ],
        ];

        foreach ($agendas as $agenda) {
            Agenda::firstOrCreate(
                ['name' => $agenda['name']],
                ['description' => $agenda['description']]
            );
        }
    }
}
