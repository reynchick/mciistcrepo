<?php

namespace Database\Seeders;

use App\Models\SRIG;
use Illuminate\Database\Seeder;

class SRIGSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $srigs = [
            [
                'name' => 'SRIG1: Artificial Intelligence & Machine Learning',
                'description' => 'Research focusing on AI, ML, and their applications'
            ],
            [
                'name' => 'SRIG2: Sustainable Agriculture',
                'description' => 'Research on sustainable farming practices and agricultural innovation'
            ],
            [
                'name' => 'SRIG3: Sustainable Agriculture and Food Systems',
                'description' => 'Research on sustainable farming practices, precision agriculture, and food security',
            ],
            [
                'name' => 'SRIG4: Renewable Energy and Green Technology',
                'description' => 'Studies on solar, wind, hydro energy, and sustainable technological solutions',
            ],
            [
                'name' => 'SRIG5: Public Health and Epidemiology',
                'description' => 'Research on disease prevention, health systems, and community health programs',
            ],
            [
                'name' => 'SRIG6: Climate Change and Environmental Science',
                'description' => 'Studies on climate change impacts, environmental monitoring, and conservation',
            ],
            [
                'name' => 'SRIG7: Education Technology and Pedagogy',
                'description' => 'Research on e-learning, educational technology tools, and innovative teaching methods',
            ],
            [
                'name' => 'SRIG8: Biodiversity and Conservation',
                'description' => 'Studies on ecosystem preservation, species conservation, and biodiversity monitoring',
            ],
            [
                'name' => 'SRIG9: Data Science and Analytics',
                'description' => 'Research on big data, data mining, predictive analytics, and business intelligence',
            ],
            [
                'name' => 'SRIG10: Social Innovation and Community Engagement',
                'description' => 'Studies on community development, social entrepreneurship, and participatory research',
            ],
            [
                'name' => 'SRIG11: Disaster Management and Resilience',
                'description' => 'Research on disaster preparedness, early warning systems, and community resilience',
            ],
            [
                'name' => 'SRIG12: Cybersecurity and Information Systems',
                'description' => 'Studies on network security, data protection, and secure information systems',
            ],
            [
                'name' => 'SRIG13: Healthcare Innovation and Medical Technology',
                'description' => 'Research on telemedicine, medical devices, and healthcare delivery systems',
            ],
            [
                'name' => 'SRIG14: Water Resource Management',
                'description' => 'Studies on water conservation, watershed management, and sustainable water systems',
            ],
            [
                'name' => 'SRIG15: Indigenous Knowledge Systems',
                'description' => 'Research on traditional knowledge, cultural practices, and their modern applications',
            ],
        ];

        foreach ($srigs as $srig) {
            SRIG::create($srig);
        }
    }
}
