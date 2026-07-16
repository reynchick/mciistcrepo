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
                'name' => 'AGENDA1: Agriculture, Aquatic, and Agro-Forestry',
                'description' => 'Food safety/security, production systems (Urban Ag, Precision & Smart Agriculture), post-production, IKSP, and more.',
            ],
            [
                'name' => 'AGENDA2: Business and Trade',
                'description' => 'Business/technopreneurship, eCommerce/blockchain, Tourism & Hospitality, Business Climate, Finance & Accounting, Economics.',
            ],
            [
                'name' => 'AGENDA3: Social Sciences and Education',
                'description' => 'Culture, arts, teaching & learning, literacies/numeracy, indigenous knowledge systems, language & literature, gender & development.',
            ],
            [
                'name' => 'AGENDA4: Engineering and Technology',
                'description' => 'Industrial Applications, Artificial Intelligence, Eco-Engineering, Geoscience/Geotechnology, Information and Computing, Smart Cities, Energy, Emerging Technologies.',
            ],
            [
                'name' => 'AGENDA5: Environment and Natural Resources',
                'description' => 'Biodiversity, climate change, water/watershed management, pollution control, urban planning, mining management',
            ],
            [
                'name' => 'AGENDA6: Health and Wellness',
                'description' => 'Nutrition, disease diagnostics, health management systems, drugs (Halal/Indigenous), GAD and inclusivity.',
            ],
            [
                'name' => 'AGENDA7: Peace and Security',
                'description' => 'Conflict/dispute resolution, IDPs, public policy, human rights, cybersecurity (from a peace/security lens), jail management.',
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
