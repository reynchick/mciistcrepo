<?php

namespace Database\Seeders;

use App\Models\Agenda;
use App\Models\Research;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ResearchAgendaSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'COPTURE:%' => 'AGENDA12: Urban Planning and Smart Cities',
            'FINNISH NA:%' => 'AGENDA8: Food Security and Nutrition',
            'CODE CAPTURE:%' => 'AGENDA4: Educational Innovation',
            'HEEDER:%' => 'AGENDA4: Educational Innovation',
            'SMARTASTH:%' => 'AGENDA3: Health and Wellness',
            'AEROFREE:%' => 'AGENDA6: Disaster Risk Reduction and Management',
            'IMONGMOTHER:%' => 'AGENDA3: Health and Wellness',
            'CAREFUL:%' => 'AGENDA12: Urban Planning and Smart Cities',
            'TRAVIL:%' => 'AGENDA12: Urban Planning and Smart Cities',
            'LEARNDYS:%' => 'AGENDA4: Educational Innovation',
            'PACOOL:%' => 'AGENDA3: Health and Wellness',
            'COPIoT:%' => 'AGENDA8: Food Security and Nutrition',
            'E-MONGANI:%' => 'AGENDA8: Food Security and Nutrition',
            'DamageXpert:%' => 'AGENDA8: Food Security and Nutrition',
            'QualitAire:%' => 'AGENDA2: Climate Change and Environmental Sustainability',
            'DESIGN AND DEVELOPMENT OF A MOBILE-BASED MALICIOUS%' => 'AGENDA1: Digital Transformation',
            'STUDYMATE:%' => 'AGENDA4: Educational Innovation',
            'STRESSSENSE:%' => 'AGENDA3: Health and Wellness',
            'ATONGSECRET:%' => 'AGENDA1: Digital Transformation',
            'lsdaCulture%' => 'AGENDA8: Food Security and Nutrition',
            'UVwearloT:%' => 'AGENDA3: Health and Wellness',
            'EMPATHYVR:%' => 'AGENDA5: Community Development and Social Inclusion',
            "SOS'IoT:%" => 'AGENDA10: Governance and Policy Development',
            'RedPing:%' => 'AGENDA6: Disaster Risk Reduction and Management',
            'IoTae:%' => 'AGENDA8: Food Security and Nutrition',
            'Project T-RAT:%' => 'AGENDA3: Health and Wellness',
            'HAPPAG:%' => 'AGENDA8: Food Security and Nutrition',
            'DIPRICE:%' => 'AGENDA8: Food Security and Nutrition',
            'HeHaSpot:%' => 'AGENDA3: Health and Wellness',
            'SPEEDISOR:%' => 'AGENDA12: Urban Planning and Smart Cities',
            'HALINON:%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'BreakApp:%' => 'AGENDA11: Energy Transition and Renewable Resources',
            'DRIVECARE:%' => 'AGENDA12: Urban Planning and Smart Cities',
            'TransBraille:%' => 'AGENDA5: Community Development and Social Inclusion',
            'FINDING SAFETY IN TECHNOLOGY:%' => 'AGENDA10: Governance and Policy Development',
            'SAFE210T:%' => 'AGENDA2: Climate Change and Environmental Sustainability',
            'NailScanner:%' => 'AGENDA3: Health and Wellness',
            'AgrE:%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'PaReserve:%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'PIGGYWEARIOT:%' => 'AGENDA8: Food Security and Nutrition',
            'ANALINK:%' => 'AGENDA1: Digital Transformation',
            'KAPETa:%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'STOCKWISE:%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'PRIVACY QUEST:%' => 'AGENDA1: Digital Transformation',
            'Design and Development of Web-Based Data Privacy%' => 'AGENDA10: Governance and Policy Development',
            'BOXDOTS++:%' => 'AGENDA1: Digital Transformation',
            'PREDICTALYST:%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'PARAQUEUE:%' => 'AGENDA12: Urban Planning and Smart Cities',
            'LAON:%' => 'AGENDA8: Food Security and Nutrition',
            'ELIAS:%' => 'AGENDA1: Digital Transformation',
            'E-PAGDIWANG%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'RECONSTRUCT:%' => 'AGENDA2: Climate Change and Environmental Sustainability',
            'AEGUIDE:%' => 'AGENDA5: Community Development and Social Inclusion',
            'BAGSAKAN:%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'DAYR:%' => 'AGENDA3: Health and Wellness',
            'PROJECT TAPPERWARE:%' => 'AGENDA11: Energy Transition and Renewable Resources',
            'E-CRUNCH:%' => 'AGENDA3: Health and Wellness',
            'KeyMouTion:%' => 'AGENDA4: Educational Innovation',
            'ON THE SUITABILITY OF CACAO%' => 'AGENDA2: Climate Change and Environmental Sustainability',
            'SNAPDRIVE:%' => 'AGENDA10: Governance and Policy Development',
            'SEMANTIC SEARCH ENGINE%' => 'AGENDA1: Digital Transformation',
            'DETECTING COVID-19%' => 'AGENDA3: Health and Wellness',
            'A HYBRID MACHINE LEARNING MODEL%' => 'AGENDA3: Health and Wellness',
            'A PREDICTIVE MODEL FOR SEA LEVEL%' => 'AGENDA6: Disaster Risk Reduction and Management',
            'DETECTING POTENTIAL FISHING ZONES%' => 'AGENDA8: Food Security and Nutrition',
            'PREDICTING WATER QUALITY%' => 'AGENDA8: Food Security and Nutrition',
            'AUTOMATED SEMANTIC SEGMENTATION%' => 'AGENDA3: Health and Wellness',
            'CLASSIFYING CAVENDISH%' => 'AGENDA8: Food Security and Nutrition',
            'DeVICE:%' => 'AGENDA3: Health and Wellness',
            'DURIO:%' => 'AGENDA8: Food Security and Nutrition',
            'AUTOMATED CRYPTOCURRENCY%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'DETECTION POTENTIAL FISHING ZONES IN DAVAO%' => 'AGENDA8: Food Security and Nutrition',
            'Identifying Library Service%' => 'AGENDA4: Educational Innovation',
            'THE CHANGING ROLES%' => 'AGENDA5: Community Development and Social Inclusion',
            'Digital Rights Management%' => 'AGENDA1: Digital Transformation',
            'InProperR:%' => 'AGENDA1: Digital Transformation',
            'Acceptability Level%' => 'AGENDA4: Educational Innovation',
            'An Exploratory Study%' => 'AGENDA4: Educational Innovation',
            'USeP Digital Library:%' => 'AGENDA1: Digital Transformation',
            'Indexinator:%' => 'AGENDA1: Digital Transformation',
            'Managing the USeP Museum:%' => 'AGENDA9: Cultural Heritage and Indigenous Knowledge',
            'Effectiveness of Marketing Strategies%' => 'AGENDA4: Educational Innovation',
            'The Lived Experiences%' => 'AGENDA3: Health and Wellness',
            'The Level of Utilization%' => 'AGENDA4: Educational Innovation',
            'Data Visualization%' => 'AGENDA1: Digital Transformation',
            'Designing COLINet%' => 'AGENDA1: Digital Transformation',
            'ManDia App:%' => 'AGENDA9: Cultural Heritage and Indigenous Knowledge',
            'PLAIbrary:%' => 'AGENDA1: Digital Transformation',
            'From Memory to Web:%' => 'AGENDA9: Cultural Heritage and Indigenous Knowledge',
            'Development of an Alternative%' => 'AGENDA4: Educational Innovation',
            'Development of Online Library%' => 'AGENDA7: Economic Development and Entrepreneurship',
            'Development of Web-Based Support%' => 'AGENDA1: Digital Transformation',
            'C-MAP Analytics:%' => 'AGENDA1: Digital Transformation',
        ];

        $now = Carbon::now();
        foreach ($data as $titlePattern => $agendaName) {
            $research = Research::query()->where('research_title', 'like', $titlePattern)->first();
            $agenda = Agenda::query()->where('name', $agendaName)->first();

            if ($research && $agenda) {
                $research->agendas()->syncWithoutDetaching([
                    $agenda->id => ['created_at' => $now, 'updated_at' => $now],
                ]);
            }
        }
    }
}
