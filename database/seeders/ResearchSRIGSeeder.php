<?php

namespace Database\Seeders;

use App\Models\Research;
use App\Models\Srig;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ResearchSRIGSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'COPTURE:%' => 'SRIG12: Cybersecurity and Information Systems',
            'FINNISH NA:%' => 'SRIG2: Sustainable Agriculture',
            'CODE CAPTURE:%' => 'SRIG7: Education Technology and Pedagogy',
            'HEEDER:%' => 'SRIG7: Education Technology and Pedagogy',
            'SMARTASTH:%' => 'SRIG13: Healthcare Innovation and Medical Technology',
            'AEROFREE:%' => 'SRIG11: Disaster Management and Resilience',
            'IMONGMOTHER:%' => 'SRIG5: Public Health and Epidemiology',
            'CAREFUL:%' => 'SRIG11: Disaster Management and Resilience',
            'TRAVIL:%' => 'SRIG10: Social Innovation and Community Engagement',
            'LEARNDYS:%' => 'SRIG7: Education Technology and Pedagogy',
            'PACOOL:%' => 'SRIG13: Healthcare Innovation and Medical Technology',
            'COPIoT:%' => 'SRIG2: Sustainable Agriculture',
            'E-MONGANI:%' => 'SRIG3: Sustainable Agriculture and Food Systems',
            'DamageXpert:%' => 'SRIG2: Sustainable Agriculture',
            'QualitAire:%' => 'SRIG6: Climate Change and Environmental Science',
            'DESIGN AND DEVELOPMENT OF A MOBILE-BASED MALICIOUS%' => 'SRIG12: Cybersecurity and Information Systems',
            'STUDYMATE:%' => 'SRIG7: Education Technology and Pedagogy',
            'STRESSSENSE:%' => 'SRIG13: Healthcare Innovation and Medical Technology',
            'ATONGSECRET:%' => 'SRIG12: Cybersecurity and Information Systems',
            'lsdaCulture%' => 'SRIG14: Water Resource Management',
            'UVwearloT:%' => 'SRIG13: Healthcare Innovation and Medical Technology',
            'EMPATHYVR:%' => 'SRIG7: Education Technology and Pedagogy',
            "SOS'IoT:%" => 'SRIG10: Social Innovation and Community Engagement',
            'RedPing:%' => 'SRIG11: Disaster Management and Resilience',
            'IoTae:%' => 'SRIG14: Water Resource Management',
            'Project T-RAT:%' => 'SRIG5: Public Health and Epidemiology',
            'HAPPAG:%' => 'SRIG10: Social Innovation and Community Engagement',
            'DIPRICE:%' => 'SRIG3: Sustainable Agriculture and Food Systems',
            'HeHaSpot:%' => 'SRIG5: Public Health and Epidemiology',
            'SPEEDISOR:%' => 'SRIG10: Social Innovation and Community Engagement',
            'HALINON:%' => 'SRIG9: Data Science and Analytics',
            'BreakApp:%' => 'SRIG4: Renewable Energy and Green Technology',
            'DRIVECARE:%' => 'SRIG13: Healthcare Innovation and Medical Technology',
            'TransBraille:%' => 'SRIG7: Education Technology and Pedagogy',
            'FINDING SAFETY IN TECHNOLOGY:%' => 'SRIG11: Disaster Management and Resilience',
            'SAFE210T:%' => 'SRIG14: Water Resource Management',
            'NailScanner:%' => 'SRIG13: Healthcare Innovation and Medical Technology',
            'AgrE:%' => 'SRIG12: Cybersecurity and Information Systems',
            'PaReserve:%' => 'SRIG12: Cybersecurity and Information Systems',
            'PIGGYWEARIOT:%' => 'SRIG5: Public Health and Epidemiology',
            'ANALINK:%' => 'SRIG12: Cybersecurity and Information Systems',
            'KAPETa:%' => 'SRIG10: Social Innovation and Community Engagement',
            'STOCKWISE:%' => 'SRIG9: Data Science and Analytics',
            'PRIVACY QUEST:%' => 'SRIG12: Cybersecurity and Information Systems',
            'Design and Development of Web-Based Data Privacy%' => 'SRIG12: Cybersecurity and Information Systems',
            'BOXDOTS++:%' => 'SRIG12: Cybersecurity and Information Systems',
            'PREDICTALYST:%' => 'SRIG9: Data Science and Analytics',
            'PARAQUEUE:%' => 'SRIG9: Data Science and Analytics',
            'LAON:%' => 'SRIG2: Sustainable Agriculture',
            'ELIAS:%' => 'SRIG12: Cybersecurity and Information Systems',
            'E-PAGDIWANG%' => 'SRIG10: Social Innovation and Community Engagement',
            'RECONSTRUCT:%' => 'SRIG6: Climate Change and Environmental Science',
            'AEGUIDE:%' => 'SRIG7: Education Technology and Pedagogy',
            'BAGSAKAN:%' => 'SRIG12: Cybersecurity and Information Systems',
            'DAYR:%' => 'SRIG5: Public Health and Epidemiology',
            'PROJECT TAPPERWARE:%' => 'SRIG4: Renewable Energy and Green Technology',
            'E-CRUNCH:%' => 'SRIG9: Data Science and Analytics',
            'KeyMouTion:%' => 'SRIG7: Education Technology and Pedagogy',
            'ON THE SUITABILITY OF CACAO%' => 'SRIG6: Climate Change and Environmental Science',
            'SNAPDRIVE:%' => 'SRIG12: Cybersecurity and Information Systems',
            'SEMANTIC SEARCH ENGINE%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'DETECTING COVID-19%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'A HYBRID MACHINE LEARNING MODEL%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'A PREDICTIVE MODEL FOR SEA LEVEL%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'DETECTING POTENTIAL FISHING ZONES%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'PREDICTING WATER QUALITY%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'AUTOMATED SEMANTIC SEGMENTATION%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'CLASSIFYING CAVENDISH%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'DeVICE:%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'DURIO:%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'AUTOMATED CRYPTOCURRENCY%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'DETECTION POTENTIAL FISHING ZONES IN DAVAO%' => 'SRIG1: Artificial Intelligence & Machine Learning',
            'Identifying Library Service%' => 'SRIG10: Social Innovation and Community Engagement',
            'THE CHANGING ROLES%' => 'SRIG10: Social Innovation and Community Engagement',
            'Digital Rights Management%' => 'SRIG12: Cybersecurity and Information Systems',
            'InProperR:%' => 'SRIG12: Cybersecurity and Information Systems',
            'Acceptability Level%' => 'SRIG7: Education Technology and Pedagogy',
            'An Exploratory Study%' => 'SRIG10: Social Innovation and Community Engagement',
            'USeP Digital Library:%' => 'SRIG7: Education Technology and Pedagogy',
            'Indexinator:%' => 'SRIG9: Data Science and Analytics',
            'Managing the USeP Museum:%' => 'SRIG15: Indigenous Knowledge Systems',
            'Effectiveness of Marketing Strategies%' => 'SRIG10: Social Innovation and Community Engagement',
            'The Lived Experiences%' => 'SRIG5: Public Health and Epidemiology',
            'The Level of Utilization%' => 'SRIG7: Education Technology and Pedagogy',
            'Data Visualization%' => 'SRIG9: Data Science and Analytics',
            'Designing COLINet%' => 'SRIG7: Education Technology and Pedagogy',
            'ManDia App:%' => 'SRIG15: Indigenous Knowledge Systems',
            'PLAIbrary:%' => 'SRIG10: Social Innovation and Community Engagement',
            'From Memory to Web:%' => 'SRIG15: Indigenous Knowledge Systems',
            'Development of an Alternative%' => 'SRIG7: Education Technology and Pedagogy',
            'Development of Online Library%' => 'SRIG7: Education Technology and Pedagogy',
            'Development of Web-Based Support%' => 'SRIG12: Cybersecurity and Information Systems',
            'C-MAP Analytics:%' => 'SRIG9: Data Science and Analytics',
        ];

        $now = Carbon::now();
        foreach ($data as $titlePattern => $srigName) {
            $research = Research::query()->where('research_title', 'like', $titlePattern)->first();
            $srig = Srig::query()->where('name', $srigName)->first();

            if ($research && $srig) {
                $research->srigs()->syncWithoutDetaching([
                    $srig->id => ['created_at' => $now, 'updated_at' => $now],
                ]);
            }
        }
    }
}
