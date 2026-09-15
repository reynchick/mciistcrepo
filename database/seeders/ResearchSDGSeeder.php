<?php

namespace Database\Seeders;

use App\Models\Research;
use App\Models\Sdg;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ResearchSDGSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'COPTURE:%' => 'SDG11: Sustainable Cities and Communities',
            'FINNISH NA:%' => 'SDG14: Life Below Water',
            'CODE CAPTURE:%' => 'SDG4: Quality Education',
            'HEEDER:%' => 'SDG4: Quality Education',
            'SMARTASTH:%' => 'SDG3: Good Health and Well-Being',
            'AEROFREE:%' => 'SDG11: Sustainable Cities and Communities',
            'IMONGMOTHER:%' => 'SDG3: Good Health and Well-Being',
            'CAREFUL:%' => 'SDG11: Sustainable Cities and Communities',
            'TRAVIL:%' => 'SDG11: Sustainable Cities and Communities',
            'LEARNDYS:%' => 'SDG4: Quality Education',
            'PACOOL:%' => 'SDG3: Good Health and Well-Being',
            'COPIoT:%' => 'SDG12: Responsible Consumption and Production',
            'E-MONGANI:%' => 'SDG2: Zero Hunger',
            'DamageXpert:%' => 'SDG2: Zero Hunger',
            'QualitAire:%' => 'SDG3: Good Health and Well-Being',
            'DESIGN AND DEVELOPMENT OF A MOBILE-BASED MALICIOUS%' => 'SDG16: Peace, Justice and Strong Institutions',
            'STUDYMATE:%' => 'SDG4: Quality Education',
            'STRESSSENSE:%' => 'SDG3: Good Health and Well-Being',
            'ATONGSECRET:%' => 'SDG16: Peace, Justice and Strong Institutions',
            'lsdaCulture%' => 'SDG14: Life Below Water',
            'UVwearloT:%' => 'SDG3: Good Health and Well-Being',
            'EMPATHYVR:%' => 'SDG4: Quality Education',
            "SOS'IoT:%" => 'SDG11: Sustainable Cities and Communities',
            'RedPing:%' => 'SDG11: Sustainable Cities and Communities',
            'IoTae:%' => 'SDG14: Life Below Water',
            'Project T-RAT:%' => 'SDG3: Good Health and Well-Being',
            'HAPPAG:%' => 'SDG2: Zero Hunger',
            'DIPRICE:%' => 'SDG2: Zero Hunger',
            'HeHaSpot:%' => 'SDG3: Good Health and Well-Being',
            'SPEEDISOR:%' => 'SDG11: Sustainable Cities and Communities',
            'HALINON:%' => 'SDG8: Decent Work and Economic Growth',
            'BreakApp:%' => 'SDG7: Affordable and Clean Energy',
            'DRIVECARE:%' => 'SDG11: Sustainable Cities and Communities',
            'TransBraille:%' => 'SDG10: Reduced Inequalities',
            'FINDING SAFETY IN TECHNOLOGY:%' => 'SDG16: Peace, Justice and Strong Institutions',
            'SAFE210T:%' => 'SDG6: Clean Water and Sanitation',
            'NailScanner:%' => 'SDG3: Good Health and Well-Being',
            'AgrE:%' => 'SDG8: Decent Work and Economic Growth',
            'PaReserve:%' => 'SDG8: Decent Work and Economic Growth',
            'PIGGYWEARIOT:%' => 'SDG3: Good Health and Well-Being',
            'ANALINK:%' => 'SDG16: Peace, Justice and Strong Institutions',
            'KAPETa:%' => 'SDG8: Decent Work and Economic Growth',
            'STOCKWISE:%' => 'SDG8: Decent Work and Economic Growth',
            'PRIVACY QUEST:%' => 'SDG4: Quality Education',
            'Design and Development of Web-Based Data Privacy%' => 'SDG16: Peace, Justice and Strong Institutions',
            'BOXDOTS++:%' => 'SDG16: Peace, Justice and Strong Institutions',
            'PREDICTALYST:%' => 'SDG8: Decent Work and Economic Growth',
            'PARAQUEUE:%' => 'SDG11: Sustainable Cities and Communities',
            'LAON:%' => 'SDG2: Zero Hunger',
            'ELIAS:%' => 'SDG16: Peace, Justice and Strong Institutions',
            'E-PAGDIWANG%' => 'SDG8: Decent Work and Economic Growth',
            'RECONSTRUCT:%' => 'SDG12: Responsible Consumption and Production',
            'AEGUIDE:%' => 'SDG10: Reduced Inequalities',
            'BAGSAKAN:%' => 'SDG8: Decent Work and Economic Growth',
            'DAYR:%' => 'SDG3: Good Health and Well-Being',
            'PROJECT TAPPERWARE:%' => 'SDG7: Affordable and Clean Energy',
            'E-CRUNCH:%' => 'SDG3: Good Health and Well-Being',
            'KeyMouTion:%' => 'SDG4: Quality Education',
            'ON THE SUITABILITY OF CACAO%' => 'SDG13: Climate Action',
            'SNAPDRIVE:%' => 'SDG16: Peace, Justice and Strong Institutions',
            'SEMANTIC SEARCH ENGINE%' => 'SDG9: Industry, Innovation and Infrastructure',
            'DETECTING COVID-19%' => 'SDG3: Good Health and Well-Being',
            'A HYBRID MACHINE LEARNING MODEL%' => 'SDG3: Good Health and Well-Being',
            'A PREDICTIVE MODEL FOR SEA LEVEL%' => 'SDG13: Climate Action',
            'DETECTING POTENTIAL FISHING ZONES%' => 'SDG14: Life Below Water',
            'PREDICTING WATER QUALITY%' => 'SDG14: Life Below Water',
            'AUTOMATED SEMANTIC SEGMENTATION%' => 'SDG3: Good Health and Well-Being',
            'CLASSIFYING CAVENDISH%' => 'SDG2: Zero Hunger',
            'DeVICE:%' => 'SDG3: Good Health and Well-Being',
            'DURIO:%' => 'SDG2: Zero Hunger',
            'AUTOMATED CRYPTOCURRENCY%' => 'SDG8: Decent Work and Economic Growth',
            'DETECTION POTENTIAL FISHING ZONES IN DAVAO%' => 'SDG14: Life Below Water',
            'Identifying Library Service%' => 'SDG4: Quality Education',
            'THE CHANGING ROLES%' => 'SDG10: Reduced Inequalities',
            'Digital Rights Management%' => 'SDG16: Peace, Justice and Strong Institutions',
            'InProperR:%' => 'SDG16: Peace, Justice and Strong Institutions',
            'Acceptability Level%' => 'SDG4: Quality Education',
            'An Exploratory Study%' => 'SDG4: Quality Education',
            'USeP Digital Library:%' => 'SDG4: Quality Education',
            'Indexinator:%' => 'SDG9: Industry, Innovation and Infrastructure',
            'Managing the USeP Museum:%' => 'SDG11: Sustainable Cities and Communities',
            'Effectiveness of Marketing Strategies%' => 'SDG4: Quality Education',
            'The Lived Experiences%' => 'SDG3: Good Health and Well-Being',
            'The Level of Utilization%' => 'SDG4: Quality Education',
            'Data Visualization%' => 'SDG9: Industry, Innovation and Infrastructure',
            'Designing COLINet%' => 'SDG9: Industry, Innovation and Infrastructure',
            'ManDia App:%' => 'SDG10: Reduced Inequalities',
            'PLAIbrary:%' => 'SDG17: Partnerships for the Goals',
            'From Memory to Web:%' => 'SDG11: Sustainable Cities and Communities',
            'Development of an Alternative%' => 'SDG4: Quality Education',
            'Development of Online Library%' => 'SDG4: Quality Education',
            'Development of Web-Based Support%' => 'SDG9: Industry, Innovation and Infrastructure',
            'C-MAP Analytics:%' => 'SDG9: Industry, Innovation and Infrastructure',
        ];

        $now = Carbon::now();
        foreach ($data as $titlePattern => $sdgName) {
            $research = Research::query()->where('research_title', 'like', $titlePattern)->first();
            $sdg = Sdg::query()->where('name', $sdgName)->first();

            if ($research && $sdg) {
                $research->sdgs()->syncWithoutDetaching([
                    $sdg->id => ['created_at' => $now, 'updated_at' => $now],
                ]);
            }
        }
    }
}
