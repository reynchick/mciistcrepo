<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Research;
use App\Models\Keyword;
use Illuminate\Support\Carbon;

class ResearchKeywordSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'COPTURE: AUTOMATION OF TRAFFIC TICKET ISSUANCE USING PDF417%' => [
                'Traffic citations',
                'Double encoding',
                'Traffic ticket issuance',
                'Web-based record system',
                'Rapid Application Development (RAD)',
                'Driver\'s license scanning',
                'Traffic management',
            ],
            'FINNISH NA: AN IOT APPLICATION SYSTEM FOR FISH MORTALITY%' => [
                'Fish mortality',
                'Ultrasonic sensor',
                'Fish disease',
                'Fish farm management',
                'Automated detection system',
                'Water contamination',
                'Mortality rate monitoring',
            ],
            'CODE CAPTURE: MOBILE IDE FOR ENHANCING PROGRAMMING LOGIC%' => [
                'Laptops and smartphones',
                'Economically marginalized students',
                'Programming logic',
                'Mobile IDE',
                'OCR technology',
                'Executable scripts',
                'Rapid Application Development (RAD)',
            ],
            'HEEDER: A VOIP-BASED HYBRID MOBILE APPLICATION FOR CLASSROOM INSTRUCTION%' => [
                'Classroom distractions',
                'Mobile device usage',
                'VOIP-enabled application',
                'Hybrid voice distribution',
                'Dynamic Systems Development Method (DSDM)',
                'Cordova framework',
                'Real-time voice broadcasting',
            ],
            'SMARTASTH: A MOBILE APPLICATION FOR REAL-TIME MONITORING OF ASTHMATIC PATIENTS%' => [
                'Asthma monitoring',
                'Spirometry test',
                'Peak Expiratory Flow',
                'Wireless sensor networks',
                'Embedded systems',
                'Smartphone-based detection',
                'Respiratory health monitoring',
            ],
            'AEROFREE: AN IOT-ENABLED LPG LEAK DETECTION SYSTEM WITH%' => [
                'Gas leak detection',
                'Fire prevention',
                'Arduino-based LPG sensor',
                'Aerofree app',
                'Rapid Application Development (RAD)',
                'Community safety awareness',
                'Real-time notifications',
            ],
            'IMONGMOTHER: AN ANDROID-BASED COMMUNITY BREAST MILK SHARING%' => [
                'Breastmilk donation',
                'Breastfeeding culture',
                'Milk-sharing platform',
                'GPS-based donor matching',
                'Rapid Application Development (RAD)',
                'Postpartum support',
                'Mother and child health',
            ],
            'CAREFUL: A MOBILE-BASED ROAD ALERT APPLICATION FOR%' => [
                'Road traffic accidents',
                'Pedestrian and driver safety',
                'Human error in accidents',
                'Mobile alert system',
                'Accident-prone areas',
                'Speed limit awareness',
                'Traffic safety technology',
            ],
            'TRAVIL: A MOBILE APPLICATION COMPLAINT TOOL FOR%' => [
                'Traffic congestion',
                'Traffic violations',
                'Mobile-based application',
                'Live video feed',
                'Real-time location tracking',
                'Traffic enforcement technology',
                'Ionic Framework and Java',
            ],
            'LEARNDYS: AN EDUCATIONAL LEARNING APPLICATION FOR DYSLEXIC%' => [
                'Dyslexia intervention',
                'Learning disability',
                'Educational learning application',
                'Cognitive and psychomotor activities',
                'Early childhood education',
                'R.A.S.E. Model',
                'Mobile learning technology',
            ],
            'PACOOL: A WEARABLE DEVICE PROVIDING COOLING EFFECT TO PREVENT HEAT-RELATED%' => [
                'Heatwave prevention',
                'Heatstroke and heat exhaustion',
                'Body temperature monitoring',
                'Wearable cooling device',
                'Real-time mobile application',
                'Peltier module technology',
                'Heat protection',
            ],
            'COPIoT: A WEB BASED MONITORING SYSTEM FOR%' => [
                'Copra drying automation',
                'Artificial drying machine',
                'Moisture content monitoring',
                'Web-based monitoring system',
                'Traditional vs. artificial drying',
                'Quality control in copra production',
                'Small-scale coconut farmers',
            ],
            'E-MONGANI: A MOBILE APPLICATION FOR MARKETING RICE THROUGH A BIDDING%' => [
                'E-commerce',
                'Palay bidding',
                'Rice law impact',
                'Direct market',
                'Scrum method',
                'Digital trade',
                'No middlemen',
            ],
            'DamageXpert: A MOBILE-BASED APPLICATION FOR THE IDENTIFICATION OF DAMAGE%' => [
                'Rice pest detection',
                'Stem borer & leaf blast',
                'Farmer assistance',
                'Mobile solution',
                'Integrated pest management',
                'Improved crop yield',
                'Accurate treatment',
            ],
            'QualitAire: An IoT-Based Air Quality Monitoring System%' => [
                'Air pollution',
                'Air Quality Index (AQI)',
                'Internet of Things (IoT)',
                'DSM501A PM Sensor',
                'MQ7 CO Sensor',
                'MQ131 O3 Sensor',
                'Cloud database',
                'Arduino UNO',
            ],
            'DESIGN AND DEVELOPMENT OF A MOBILE-BASED MALICIOUS%' => [
                'Malicious URL',
                'URL classification prediction',
                'XGBoost',
                'Mobile application',
                'Text recognition',
            ],
            'STUDYMATE: A STUDY PEER RECOMMENDER APP USING RECIPROCAL%' => [
                'Study peer recommender system',
                'Study partner',
                'Study group',
                'Reciprocal recommendation algorithm',
                'Informal learning communities',
                'Student traits',
                'Communicative openness',
                'Personality',
            ],
            'STRESSSENSE: A STRESS LEVEL DETECTOR FOR DETERMINATION OF STRESS%' => [
                'Stress detector',
                'Physiological data',
                'Galvanic Skin Response (GSR)',
                'Pulse sensor',
                'Beats-per-minute (BPM)',
                'Stress parameters',
                'Fuzzy logic method',
                'Arduino',
            ],
            'ATONGSECRET: A WEB-BASED FILE SHARING AND MESSAGING APPLICATION%' => [
                'Steganography',
                'Stego picture',
                'Least Significant Bit Steganography',
                'PHP',
                'CSS',
                'HTML',
                'MySQL',
                'AJAX',
            ],
            'lsdaCulture An IoT — Based Water Temperature and Dissolved Oxygen Level%' => [
                'Aquaculture',
                'Water temperature',
                'Dissolved oxygen',
                'Smart fish pond monitoring',
                'Sensors',
                'Microcontroller',
                'WiFi module',
                'Actuators',
            ],
            'UVwearloT: AN IoT BASED WEARABLE DEVICE COMPOSE OF TWO SMART SENSORS%' => [
                'UV radiation',
                'Ultraviolet Index (UVI)',
                'UV sensor',
                'Pulse rate sensor',
                'Skin cancer risk',
                'Android Studio',
                'Arduino IDE',
                'Arduino UNO',
            ],
            'EMPATHYVR: A LEARNING COMMUNICATION PLATFORM FOR CHILDREN%' => [
                'Autism Spectrum Disorder',
                'Communication challenges',
                'Assistive technology',
                'Virtual reality',
                'Game-based learning',
            ],
            'SOS\'IoT: A Noise Monitoring and Warning Tool%' => [
                'Noise monitoring',
                'Barangay peace and order',
                'Rapid Application Development (RAD)',
                'ESP8266',
                'KY-038 microphone',
                'Arduino',
                'Simulator development',
                'Decibel analysis',
            ],
            'RedPing: An IoT-Based Flood Detection System%' => [
                'Flooding',
                'Flood monitoring',
                'Flood levels',
                'RedPing',
                'IoT-based solution',
                'Sonar technology',
                'False readings',
                'Server',
            ],
            'IoTae: A WEB BASED MONITORING SYSTEM FOR%' => [
                'IoTae',
                'pH',
                'Dissolved oxygen',
                'Freshwater environment',
                'DO sensors',
                'Pond owners',
                'Modified Waterfall Model',
                'Aeration process',
            ],
            'Project T-RAT: An IoT Based Smart-Trapper for Rats%' => [
                'Rodentia',
                'Smart trapper',
                'Rats',
                'Rodent control',
                'Sensors',
                'Infrared sensor',
                'Camera',
                'Automatic trap',
            ],
            'HAPPAG: A MOBILE APPLICATION CONNECTING FOOD DONORS%' => [
                'Food donors',
                'Donees',
                'Food waste prevention',
                'Landfills',
                'Agile software development',
                'Google Map API',
                'Socket.IO',
                'Food waste awareness',
            ],
            'DIPRICE: A RICE QUALITY IDENTIFIER%' => [
                'Digital Image Processing',
                'Rice quality identification',
                'Matlab Thresholding Function',
            ],
            'HeHaSpot: A Human Health Hazard%' => [
                'Mobile surveillance',
                'Waste disposal',
                'Garbage segregation',
                'Rapid Application Development (RAD)',
                'Public health',
            ],
            'SPEEDISOR: A WEB AND MOBILE%' => [
                'Speed limit',
                'Taxi driver monitoring',
                'Traffic violations',
                'Road accidents',
                'GPS tracking',
                'Vehicle speed measurement',
            ],
            'HALINON: A CROWDSOURCED PRODUCT%' => [
                'MSMEs',
                'Enterprises',
                'Crowdsourced market data',
                '"Buy" button statistics',
                'User location records',
                'PHP',
                'Geolocation API',
            ],
            'BreakApp: A WEB AND%' => [
                'Circuit overloading',
                'Circuit breaker',
                'Amperes',
                'Arduino current sensor',
                'Microcontroller',
            ],
            'DRIVECARE: A WEARABLE DEVICE%' => [
                'Driver drowsiness',
                'Eye blink sensor',
                'Automated device',
                'Traffic accidents',
                'Road safety',
            ],
            'TransBraille: A MOBILE-BASED APPLICATION FOR BRAILLE%' => [
                'Braille',
                'Blind students',
                'Uncontracted Braille (Grade 1)',
                'Contracted Braille (Grade 2)',
                'Digital Image Processing',
                'Translation',
            ],
            'FINDING SAFETY IN TECHNOLOGY: A SYSTEM FOR CRIME INCIDENT REPORTING%' => [
                'Crime incident',
                "Victim's surveillance camera",
                'ESP32-cam',
                'Crime density mapping',
                'Haversine Formula',
                'Live video feed',
                'Google Map API',
                'Metadata',
            ],
            'SAFE210T: AN AUTOMATED WATER QUALITY FILTRATION SYSTEM%' => [
                'Freshwater',
                'Water stress',
                'Water filtration',
                'Rapid Application Development (RAD)',
                'IoT',
                'Wireless sensor networks',
                'Filtration media',
                'Ultrasonic sensor',
            ],
            'NailScanner: A Non-invasive Fingernail%' => [
                'Health awareness',
                'Nail Scanner',
                'Mobile application',
                'Fingernail diseases',
                'Rapid Application Development (RAD)',
                'TensorFlow Lite',
            ],
            'AgrE: A SECURED E-COMMERCE PLATFORM%' => [
                'E-commerce',
                'Agricultural commodities',
                'Davao Food Terminal Complex',
                'Transaction tracking',
                'Security',
                'Two-Factor Authentication',
                'Data encryption',
            ],
            'PaReserve: A COSTUMIZABLE RESERVATION PLATFORM%' => [
                'Online reservation',
                'Hotel industry',
                'Fraud prevention',
                'Identity theft',
                'User verification',
                'Ratings',
                'Feedback system',
                'SSL certification',
            ],
            'PIGGYWEARIOT: A PIG COUGH SURVEILLANCE SYSTEM USING%' => [
                'IoT',
                'Pig cough detection',
                'Respiratory diseases',
                'African Swine Fever',
                'Machine learning',
                'Biosecurity',
                'Wearable device',
                'Real-time monitoring',
            ],
            'ANALINK: A MOBILE-BASED APPLICATION FOR DETECTING MALICIOUS%' => [
                'Smishing',
                'Malicious URLs',
                'SMS phishing',
                'Mobile security',
                'Blacklist database',
                'Real-time detection',
            ],
            'KAPETa: DESIGN AND DEVELOPMENT OF WEB-BASED E-COMMERCE APPLICATION FOR COFFEE%%' => [
                'E-commerce',
                'Coffee startups',
                'Davao City',
                'Market access',
                'Brand building',
                'Inventory management',
                'Digital transformation',
            ],
            'STOCKWISE: AN INVENTORY MANAGEMENT AND DEMAND FORECASTING%' => [
                'Inventory management',
                'Demand forecasting',
                'Food retailers',
                'Simple Moving Average',
                'Restock planning',
                'Sales data analysis',
            ],
            'PRIVACY QUEST: A DATA PRIVACY AWARENESS GAME%' => [
                'Data privacy',
                'Cybersecurity',
                'Game-based learning',
                'Teenagers',
                'Awareness',
                'Digital security',
                'Serious games',
            ],
            'DESIGN AND DEVELOPMENT OF WEB-BASED DATA PRIVACY%' => [
                'Data privacy',
                'Privacy Impact Assessment',
                'Web-based assessment tool',
                'Risk assessment',
                'Decision support',
            ],
            'BOXDOTS++: QUICK RESPONSE CODE SCANNER WITH MALICIOUS%' => [
                'QR code security',
                'Malicious URLs',
                'Phishing attacks',
                'Real-time detection',
                'Google Safe Browsing',
                'VirusTotal API',
            ],
            'PREDICTALYST: A HUMAN RESOURCE MANAGEMENT SYSTEM FOR%' => [
                'Employee attrition',
                'Predictive analytics',
                'Random Forest Algorithm',
                'HR management',
                'Visualization',
                'Machine learning',
            ],
            'PARAQUEUE: A REAL-TIME PUBLIC%' => [
                'Public transportation',
                'Real-time tracking',
                'Jeepneys',
                'Seat vacancy',
                'Commuter assistance',
                'Mobile application',
            ],
            'LAON: LEAF COLOR CHART%' => [
                'Rice farming',
                'Nitrogen fertilization',
                'Leaf Color Chart',
                'IoT',
                'RGB color extraction',
                'KNN Algorithm',
                'Weather forecasting',
            ],
            'ELIAS: A PERSONAL ALIASING%' => [
                'Personal aliasing',
                'Data security',
                'Identity protection',
                'Fraud prevention',
                'Secure login',
                'Browser extension',
            ],
            'E-PAGDIWANG A CUSTOMIZABLE WEB%' => [
                'Event planning',
                'SMEs',
                'Web-based platform',
                'Customer-to-customer marketing',
                'SCRUM methodology',
                'Service promotion',
            ],
            'RECONSTRUCT: A WEB-BASED MARKETPLACE%' => [
                'Construction waste',
                'Demolition recycling',
                'Marketplace',
                'Geotagging',
                'CCD waste',
                'Environmental sustainability',
            ],
            'AEGUIDE: AN AUGMENTED REALITY AND SIMULATION%' => [
                'Augmented Reality',
                'Wayfinding',
                'Intellectual disability',
                'Navigation',
                'Simulation-based learning',
                'Google API',
            ],
            'BAGSAKAN: AN ANTI-E-COMMERCE FRAUD PLATFORM%' => [
                'E-commerce',
                'Crop bidding',
                'Small-scale farmers',
                'Fraud prevention',
                'Authentication',
                'SMS OTP',
                'Identity verification',
            ],
            'DAYR: A MENTAL HEALTH SELF-MONITORING%' => [
                'Mental health',
                'Self-monitoring',
                'Diary app',
                'Journaling',
                'Mental illness',
                'Emotional well-being',
            ],
            'PROJECT TAPPERWARE: A SYSTEM FOR DETECTION OF UNAUTHORIZED ELECTRICITY CONNECTION%' => [
                'IoT',
                'Electricity theft detection',
                'Smart meter',
                'Real-time monitoring',
                'Energy security',
            ],
            'E-CRUNCH: A MOBILE APPLICATION OF BASKETBALL COACH\'S ASSISTANT%' => [
                'Basketball analytics',
                'Coach decision-making',
                'Data-driven coaching',
                'Mobile application',
                'Sports technology',
            ],
            'KeyMouTion: A WINDOWS-BASED PROGRAMMING TOOL FOR DETECTING BOREDOM%' => [
                'Programming education',
                'Student engagement',
                'Boredom detection',
                'Frustration analysis',
                'Keystrokes',
                'Mouse movements',
            ],
            'ON THE SUITABILITY OF CACAO UNDER FUTURE CLIMATIC%' => [
                'Climate change',
                'Cacao farming',
                'Neural network modeling',
                'Land suitability',
                'Future climate projections',
            ],
            'SNAPDRIVE: AN ALTERNATIVE SECURITY SYSTEM FOR MOTORCYCLE THEFT PREVENTION%' => [
                'Motorcycle Theft',
                'Property Crime',
                'SNAPDRIVE',
                'Raspberry Pi',
                'Motion Detection',
                'Facial Detection',
                'Security System',
                'Crime Prevention',
            ],
            'SEMANTIC SEARCH ENGINE OF E-COMMERCE USING NATURAL LANGUAGE PROCESSING%' => [
                'E-commerce',
                'Semantic Searching',
                'Natural Language Processing (NLP)',
                'Semantic Search Engine',
                'Elasticsearch',
                'Amazon Dataset',
                'Web Application',
                'Search Accuracy',
            ],
            'DETECTING COVID-19 FAKE NEWS INFODEMIC USING HYBRID ALGORITHM%' => [
                'Fake News',
                'Coronavirus',
                'COVID-19',
                'Machine Learning',
                'Hybrid Algorithm',
                'Twitter',
            ],
            'A HYBRID MACHINE LEARNING MODEL USING COMPUBOX DATA FOR%' => [
                'Boxing',
                'Boxers',
                'Coaches',
                'Training Plans',
                'Match Prediction',
                'Winning Conditions',
                'SVM Algorithm',
                'CompuBox Data',
            ],
            'A PREDICTIVE MODEL FOR SEA LEVEL RISE IN PHILIPPINE%' => [
                'Sea Level Rise',
                'Coastal Communities',
                'Predictive Model',
                'Random Forest Regression',
                'Feature Selection',
                'Hyperparameter Tuning',
                'Mean Absolute Error (MAE)',
                'Philippines',
            ],
            'DETECTING POTENTIAL FISHING ZONES WITH PROBABLE TOTAL CATCH%' => [
                'Fisheries',
                'Potential Fishing Zones (PFZs)',
                'Fish Catch Forecasting',
                'Seasonal Fish Catch Behavior',
                'Fish Shoals',
                'Random Forest',
                'Forecasting',
                'Resource Management',
            ],
            'PREDICTING WATER QUALITY USING MACHINE LEARNING IN AN%' => [
                'Water Quality',
                'Aquaculture Industry',
                'Fish Health',
                'Temperature',
                'pH Level',
                'Aquaculture Management',
                'Machine Learning Models',
                'Prediction Models',
            ],
            'AUTOMATED SEMANTIC SEGMENTATION OF CANCEROUS CELLS IN MAMMOGRAM%' => [
                'Breast Cancer',
                'Mammography',
                'Artificial Intelligence (AI)',
                'Early Detection',
                'Cancerous Cell Segmentation',
                'Breast Mammogram Images',
                'ResNet-152',
                'Nested UNet (UNet++)',
            ],
            'CLASSIFYING CAVENDISH BANANA MATURITY STAGE USING RESNET-18 ARCHITECTURE%%' => [
                'Banana Maturity',
                'Cavendish Banana',
                'Classification Models',
                'Transfer Learning',
                'ResNet-18 Architecture',
                'Accuracy',
                'CNN-Based Model',
                'Web-Based App',
            ],
            'DeVICE: PREDICTION AND ANALYSIS ON THE SUBSTANCE ABUSE OF%' => [
                'Substance Abuse',
                'Adolescents',
                'Drug Prevention',
                'Rehabilitation',
                'Neural Networks',
                'Prediction',
                'Geographic Maps',
                'Trend Analysis',
            ],
            'DURIO: AN API-BASED ANDROID MOBILE APPLICATION FOR DETECTING%' => [
                'Durian',
                'Durian Diseases',
                'Visual Inspection',
                'Durio Zibethinus',
                'RGB + UNet',
                'Early Detection',
                'Mobile Application',
                'Agricultural Technology',
            ],
            'AUTOMATED CRYPTOCURRENCY TRADING BOT USING MACHINE LEARNING MODEL%' => [
                'Cryptocurrency',
                'Automated Trading',
                'Machine Learning',
                'Trading Bot',
                'Bitcoin',
                'Binance',
                'Ethereum',
                'Backtesting',
            ],
            'DETECTION POTENTIAL FISHING ZONES IN DAVAO GULF: AN APPLICATION OF GEOSPATIAL%' => [
                'Philippines',
                'Davao Gulf',
                'Potential Fishing Zones (PFZ)',
                'Geospatial Data Science',
                'Sea Surface Temperature (SST)',
                'Sea Surface Chlorophyll-a Concentration (SSCC)',
                'Dashboard Application',
                'Fishing Efficiency',
            ],
            'Identifying Library Service Design Models of Public Library for Youth Development%' => [
                'Public Library',
                'Library Service Design Model',
                'Youth Development',
                'Library Resources',
                'Library Services',
                'Library Programs',
                'Community Engagement',
                'Literacy Advancement',
            ],
            'THE CHANGING ROLES OF LIBRARIANS TOWARDS PATRONS WITH SPECIAL NEEDS: THE CASE OF SELECTED LIBRARIES IN DAVAO REGION%' => [
                'Library Services',
                'Special Needs Patrons',
                'Librarian Competencies',
                'Inclusive Libraries',
                'Accessibility',
                'Library Accommodations',
                'Davao Region Libraries',
                'Quantitative Descriptive Study',
            ],
            'Digital Rights Management on the Online Database of the USeP Library%' => [
                'Digital Rights Management',
                'ODILO database',
                'Library Online Access',
            ],
            'InProperR: Intellectual Property Rights of Unpublished Materials%' => [
                'Intellectual Property',
                'Copyright',
                'Fair Use',
            ],
            'Acceptability Level of College of Information and Computing Students on Online Library Services at University of Southeastern Philippines%' => [
                'Online Library Services',
                'COVID-19 Pandemic',
                'Academic Libraries',
                'Remote Access',
                'Information and Computing Students',
                'Digital Learning Support',
                'Social Acceptability',
                'Library Service Delivery',
            ],
            'An Exploratory Study Investigating Students Outlook in Pursuing Library and Information Science%' => [
                'Library and Information Science (LIS)',
                'Student Motivation',
                'Career Aspirations',
                'Mixed-Methods Research',
                'Curriculum Development',
                'Vocational Education',
                'Higher Education',
                'University of Southeastern Philippines',
            ],
            'USeP Digital Library: An Analysis of User Acceptance and Competency Level%' => [
                'Digital Library System',
                'TAM',
                'User Acceptance Level',
                'Competency Level',
            ],
            'Indexinator: Designing a Prototype Web-Based Indexing Tool%' => [
                'Indexinator',
                'design prototype',
                'web-based indexing tool',
            ],
            'Managing the USeP Museum: A Skill Assessment for ULRC Personnel%' => [
                'University Museum',
                'Professional Core Competency',
                'Personal Skill Set',
                'Human Resource Capability',
                'Skill Assessment',
            ],
            'Effectiveness of Marketing Strategies in Promoting Public School Library Services in Davao City%' => [
                'Marketing Strategies',
                'Public School Libraries',
                'Library Marketing',
            ],
            'The Lived Experiences of Health Sciences Librarians in Evidence-Based Medicine%' => [
                'Lived Experiences',
                'Health Sciences Librarian',
                'Evidence-Based Medicine',
                'Critical Appraisal',
            ],
            'The Level of Utilization and Access of School Library: Basis for an Enhanced Reading Program%' => [
                'School Library',
                'Utilization',
                'Access',
                'Reading Comprehension',
                'Enhanced Reading Program',
            ],
            'Data Visualization of Book Collection for the University of Southeastern Philippines%' => [
                'Data Visualization',
                'Library Collection Assessment',
                'Book Collection Reports',
                'Graphical Representation of Library Resources',
                'Modified Rapid Application Development (RAD)',
            ],
            'Designing COLINet Web Portal: An Online Survey%' => [
                'COLINet Web Portal',
                'Online Survey',
                'Librarians\' Preferences',
                'Web Portal Design',
                'Feature Suggestions',
            ],
            'ManDia App: An Assistive Tool for Mandaya to English Translation%' => [
                'Mandaya-English Translation',
                'Assistive Learning Tool',
                'Offline Translation System',
                'Text, Photo, and Audio Integration',
                'Modified Iterative and Incremental Development (IID)',
            ],
            'PLAIbrary: An Online Resource Sharing of PLAI-DRLC Library Consortium%' => [
                'Resource Sharing',
                'Electronic Union Catalog',
                'Library Consortium',
                'Interactive Resource Sharing Platform',
                'Modified Rapid Application Development (RAD)',
            ],
            'From Memory to Web: An Institutional Digital Repository for the Preservation of Historical and Cultural Artifacts of the University of the Immaculate Conception%' => [
                'Digital Repository System',
                'Cultural Heritage Preservation',
                'Archiving and Metadata Management',
                'System Development Life Cycle (SDLC) Spiral Model',
                'Historical and Cultural Artifacts',
            ],
            'Development of an Alternative and Interactive Learning System in Teaching Filipino Language to Foreign Students%' => [
                'Interactive Learning System',
                'Filipino Language for Foreign Students',
                'ADDIE Model',
                'Ren\'py Visual Novel Engine',
                'Usability Testing',
            ],
            'Development of Online Library Book Fair System%' => [
                'Online Library Book Fair',
                'Book Ordering and Exhibiting System',
                'Three-Phase Development Strategy',
                'PHP and MySQL-Based System',
                'Functionality Testing and User Evaluation',
            ],
            'Development of Web-Based Support Service Ticketing System of Ateneo de Davao University Library Jacinto Campus%' => [
                'Web-Based Support Service Ticketing System',
                'Multi-Channel Support (Chat, Email, Web Form)',
                'System Development Life Cycle (SDLC) - Waterfall Model',
                'UVDesk and MySQL Integration',
                'User Acceptance Testing and Evaluation',
            ],
            'C-MAP Analytics: A Web-Based Application of Collection Mapping for University of Immaculate Conception - Learning Resource Center Graduate School Library%' => [
                'Collection Mapping',
                'Analytic',
                'Visualization',
                'Conspectus',
            ],
        ];

        foreach ($data as $titlePattern => $keywords) {
            $base = rtrim($titlePattern, '%');
            $research = Research::where('research_title', 'like', $titlePattern)->first()
                ?: Research::where('research_title', 'like', "%{$base}%")->first()
                ?: $this->matchByContainsNormalized($base)
                ?: $this->matchBySimilarity($base);

            if ($research) {
                $now = Carbon::now();

                $idsWithTimestamps = collect($keywords)
                    ->map(function ($name) {
                        return Keyword::firstOrCreate(['keyword_name' => $name]);
                    })
                    ->mapWithKeys(function ($keyword) use ($now) {
                        return [$keyword->id => [
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]];
                    })
                    ->toArray();

                $research->keywords()->syncWithoutDetaching($idsWithTimestamps);
            }
        }
    }

    protected function normalize(string $s): string
    {
        $s = strtolower($s);
        $s = preg_replace('/[^a-z0-9]+/i', ' ', $s);
        $s = preg_replace('/\s+/', ' ', $s);
        return trim($s);
    }

    protected function matchByContainsNormalized(string $base): ?Research
    {
        $needle = $this->normalize($base);
        foreach (Research::select('id', 'research_title')->get() as $r) {
            $hay = $this->normalize($r->research_title);
            if (str_contains($hay, $needle) || str_contains($needle, $hay)) {
                return Research::find($r->id);
            }
        }
        return null;
    }

    protected function matchBySimilarity(string $base): ?Research
    {
        $needle = $this->normalize($base);
        $best = null;
        $bestScore = PHP_INT_MAX;
        foreach (Research::select('id', 'research_title')->get() as $r) {
            $hay = $this->normalize($r->research_title);
            $d = levenshtein($needle, $hay);
            if ($d < $bestScore) {
                $bestScore = $d;
                $best = $r;
            }
        }
        if (!$best) return null;
        $len = max(1, strlen($needle));
        $ratio = $bestScore / $len;
        return $ratio <= 0.25 ? Research::find($best->id) : null;
    }
}
