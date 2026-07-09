<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Research;
use App\Models\Researcher;

class ResearcherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $researchProjects = [
            'COPTURE: AUTOMATION OF TRAFFIC TICKET ISSUANCE USING PDF417%' => [
                ['first_name' => 'Carl Stephen', 'middle_name' => 'G.', 'last_name' => 'Caya', 'email' => 'csgcaya@usep.edu.ph'],
                ['first_name' => 'Merra Elaiza', 'middle_name' => 'T.', 'last_name' => 'Espinosa', 'email' => null],
                ['first_name' => 'Mice Dianne', 'middle_name' => 'M.', 'last_name' => 'Moria', 'email' => null],
            ],
            'FINNISH NA: AN IOT APPLICATION SYSTEM FOR FISH MORTALITY%' => [
                ['first_name' => 'Lovely Roze', 'middle_name' => 'N.', 'last_name' => 'Amandy', 'email' => null],
                ['first_name' => 'Theona', 'middle_name' => 'F.', 'last_name' => 'Aton', 'email' => null],
                ['first_name' => 'Andrea Gail', 'middle_name' => 'N.', 'last_name' => 'Balcom', 'email' => null],
            ],
            'CODE CAPTURE: MOBILE IDE FOR ENHANCING PROGRAMMING LOGIC%' => [
                ['first_name' => 'Martkneil Jan', 'middle_name' => 'L.', 'last_name' => 'Javier', 'email' => 'mjljavier@usep.edu.ph'],
                ['first_name' => 'Christian', 'middle_name' => 'C.', 'last_name' => 'Lavilla', 'email' => null],
                ['first_name' => 'Matt Jacob', 'middle_name' => 'C.', 'last_name' => 'Rulona', 'email' => 'mjcrulona@usep.edu.ph'],
            ],
            'HEEDER: A VOIP-BASED HYBRID MOBILE APPLICATION FOR CLASSROOM INSTRUCTION%' => [
                ['first_name' => 'Reymart', 'middle_name' => 'C.', 'last_name' => 'Casas', 'email' => null],
                ['first_name' => 'Paola', 'middle_name' => 'R.', 'last_name' => 'Concubierta', 'email' => null],
                ['first_name' => 'Elvina', 'middle_name' => 'B.', 'last_name' => 'Garcia', 'email' => null],
            ],
            'SMARTASTH: A MOBILE APPLICATION FOR REAL-TIME MONITORING OF ASTHMATIC PATIENTS%' => [
                ['first_name' => 'Nica', 'middle_name' => 'C.', 'last_name' => 'Carcallas', 'email' => null],
                ['first_name' => 'Sim Japhet', 'middle_name' => 'C.', 'last_name' => 'Delos Reyes', 'email' => null],
                ['first_name' => 'Jan Enrico', 'middle_name' => 'V.', 'last_name' => 'Quinamot', 'email' => null],
            ],
            'AEROFREE: AN IOT-ENABLED LPG LEAK DETECTION SYSTEM WITH%' => [
                ['first_name' => 'Jude Norbert', 'middle_name' => 'D.', 'last_name' => 'Barsal', 'email' => null],
                ['first_name' => 'Ian James', 'middle_name' => 'V.', 'last_name' => 'Gaspar', 'email' => null],
                ['first_name' => 'Francis Lloyd', 'middle_name' => 'P.', 'last_name' => 'Ripalda', 'email' => null],
            ],
            'IMONGMOTHER: AN ANDROID-BASED COMMUNITY BREAST MILK SHARING%' => [
                ['first_name' => 'Pauline Marie', 'middle_name' => 'J.', 'last_name' => 'Dumagan', 'email' => null],
                ['first_name' => 'Kiarrah', 'middle_name' => 'R.', 'last_name' => 'Menil', 'email' => null],
                ['first_name' => 'Ma. Mitchie', 'middle_name' => 'N.', 'last_name' => 'Sampani', 'email' => null],
            ],
            'CAREFUL: A MOBILE-BASED ROAD ALERT APPLICATION FOR%' => [
                ['first_name' => 'Daryl Kate', 'middle_name' => 'T.', 'last_name' => 'Good', 'email' => null],
                ['first_name' => 'Shenny Maree', 'middle_name' => 'C.', 'last_name' => 'Ormo', 'email' => null],
            ],
            'TRAVIL: A MOBILE APPLICATION COMPLAINT TOOL FOR%' => [
                ['first_name' => 'Frances Mae', 'middle_name' => 'G.', 'last_name' => 'Dimaano', 'email' => null],
                ['first_name' => 'Rio Jessa Mae', 'middle_name' => 'N.', 'last_name' => 'Florida', 'email' => null],
            ],
            'LEARNDYS: AN EDUCATIONAL LEARNING APPLICATION FOR DYSLEXIC%' => [
                ['first_name' => 'Jonell', 'middle_name' => 'P.', 'last_name' => 'Jumang-it', 'email' => null],
                ['first_name' => 'Aira Camille', 'middle_name' => 'H.', 'last_name' => 'Lamberte', 'email' => 'achlamberte@usep.edu.ph'],
                ['first_name' => 'Amanda Jane', 'middle_name' => 'L.', 'last_name' => 'Ruelo', 'email' => 'ajlaruelo@usep.edu.ph'],
            ],
            'PACOOL: A WEARABLE DEVICE PROVIDING COOLING EFFECT TO PREVENT HEAT-RELATED%' => [
                ['first_name' => 'Jhon Vincent', 'middle_name' => null, 'last_name' => 'Bañaga', 'email' => 'jvcbanaga@usep.edu.ph'],
                ['first_name' => 'Ara Noreen', 'middle_name' => 'S.', 'last_name' => 'Manito', 'email' => null],
                ['first_name' => 'Corsiga George', 'middle_name' => 'C.', 'last_name' => 'Caturza Jr.', 'email' => null],
            ],
            'COPIoT: A WEB BASED MONITORING SYSTEM FOR%' => [
                ['first_name' => 'Noemi Andreyanne', 'middle_name' => 'L.', 'last_name' => 'Canlog', 'email' => 'nalcanlog@usep.edu.ph'],
                ['first_name' => 'Leonel', 'middle_name' => null, 'last_name' => 'Torrefiel', 'email' => 'ltorrefiel@usep.edu.ph'],
                ['first_name' => 'Cleo', 'middle_name' => 'B.', 'last_name' => 'Pantinople', 'email' => 'cbpantinople@usep.edu.ph'],
            ],
            'E-MONGANI: A MOBILE APPLICATION FOR MARKETING RICE THROUGH A BIDDING%' => [
                ['first_name' => 'Ina', 'middle_name' => 'P.', 'last_name' => 'Alegrado', 'email' => 'ipalegrado@usep.edu.ph'],
                ['first_name' => 'Trisha Marie', 'middle_name' => 'V.', 'last_name' => 'Hagunob', 'email' => 'tmvhagunob@usep.edu.ph'],
                ['first_name' => 'Angelika Mari', 'middle_name' => 'O.', 'last_name' => 'Robles', 'email' => 'amorobles@usep.edu.ph'],
            ],
            'DamageXpert: A MOBILE-BASED APPLICATION FOR THE IDENTIFICATION OF DAMAGE%' => [
                ['first_name' => 'Kenneth King Jones', 'middle_name' => 'M.', 'last_name' => 'Celocia', 'email' => null],
                ['first_name' => 'Rona', 'middle_name' => 'P.', 'last_name' => 'Licera', 'email' => null],
                ['first_name' => 'Roxan', 'middle_name' => 'S.', 'last_name' => 'Tiu', 'email' => null],
            ],
            'QualitAire: An IoT-Based Air Quality Monitoring System%' => [
                ['first_name' => 'Kristian Rebb', 'middle_name' => null, 'last_name' => 'Escaño', 'email' => 'kraescano@usep.edu.ph'],
                ['first_name' => 'Dean', 'middle_name' => null, 'last_name' => 'Siapno', 'email' => 'dpsiapno@usep.edu.ph'],
            ],
            'DESIGN AND DEVELOPMENT OF A MOBILE-BASED MALICIOUS%' => [
                ['first_name' => 'Leah', 'middle_name' => 'C.', 'last_name' => 'Juarez', 'email' => 'lcjuarez@usep.edu.ph'],
                ['first_name' => 'Sydney', 'middle_name' => 'P.', 'last_name' => 'Ricafort', 'email' => 'spricafort@usep.edu.ph'],
            ],
            'STUDYMATE: A STUDY PEER RECOMMENDER APP USING RECIPROCAL%' => [
                ['first_name' => 'Lawrence Christopher', 'middle_name' => 'G.', 'last_name' => 'Rosario', 'email' => 'lcgrosario@usep.edu.ph'],
                ['first_name' => 'John Eric Paolo', 'middle_name' => 'R.', 'last_name' => 'Gubaton', 'email' => 'jeprgubaton@usep.edu.ph'],
                ['first_name' => 'Richard', 'middle_name' => 'B.', 'last_name' => 'Peligor', 'email' => 'rbpeligor@usep.edu.ph'],
            ],
            'STRESSSENSE: A STRESS LEVEL DETECTOR FOR DETERMINATION OF STRESS%' => [
                ['first_name' => 'Arvin Garret', 'middle_name' => 'A.', 'last_name' => 'Arbizo', 'email' => 'agaarbizo@usep.edu.ph'],
                ['first_name' => 'Marc Louie', 'middle_name' => 'L.', 'last_name' => 'Balansag', 'email' => 'mllbalansag@usep.edu.ph'],
                ['first_name' => 'Christy Hyacinth', 'middle_name' => 'C.', 'last_name' => 'Carpesano', 'email' => 'chccarpesano@usep.edu.ph'],
            ],
            'ATONGSECRET: A WEB-BASED FILE SHARING AND MESSAGING APPLICATION%' => [
                ['first_name' => 'Bryle', 'middle_name' => 'G.', 'last_name' => 'Alfanta', 'email' => 'bgalfanta@usep.edu.ph'],
                ['first_name' => 'Joshua Chris', 'middle_name' => 'M.', 'last_name' => 'Duran', 'email' => 'jcmduran@usep.edu.ph'],
                ['first_name' => 'Brad Ford', 'middle_name' => 'D.', 'last_name' => 'Rosal', 'email' => 'bfdrosal@usep.edu.ph'],
            ],
            'lsdaCulture An IoT - Based Water Temperature and Dissolved Oxygen Level%' => [
                ['first_name' => 'Angelica Mae', 'middle_name' => 'G.', 'last_name' => 'Betonio', 'email' => 'amgbetonio@usep.edu.ph'],
                ['first_name' => 'Jomari', 'middle_name' => 'D.', 'last_name' => 'Ondap', 'email' => 'jdondap@usep.edu.ph'],
            ],
            'UVwearloT: AN IoT BASED WEARABLE DEVICE COMPOSE OF TWO SMART SENSORS%' => [
                ['first_name' => 'Carmilla', 'middle_name' => null, 'last_name' => 'Benalet', 'email' => 'ccbenalet@usep.edu.ph'],
                ['first_name' => 'May Flor', 'middle_name' => null, 'last_name' => 'Lape', 'email' => 'mfflape@usep.edu.ph'],
                ['first_name' => 'Reno Roy', 'middle_name' => null, 'last_name' => 'Sorima', 'email' => null],
            ],
            'EMPATHYVR: A LEARNING COMMUNICATION PLATFORM FOR CHILDREN%' => [
                ['first_name' => 'Dionne Evony', 'middle_name' => 'M.', 'last_name' => 'Diola', 'email' => 'demdiola@usep.edu.ph'],
                ['first_name' => 'Bebe Mae', 'middle_name' => 'J.', 'last_name' => 'Roxas', 'email' => 'bmjroxas@usep.edu.ph'],
                ['first_name' => 'Audrey Marie', 'middle_name' => 'M.', 'last_name' => 'Taghoy', 'email' => null],
            ],
            "SOS'IoT: A Noise Monitoring and Warning Tool%" => [
                ['first_name' => 'Chuzelyn', 'middle_name' => 'D.', 'last_name' => 'Maxino', 'email' => 'cdmaxino@usep.edu.ph'],
                ['first_name' => 'Judelyn', 'middle_name' => 'N.', 'last_name' => 'Rubia', 'email' => 'jnrubia@usep.edu.ph'],
                ['first_name' => 'Vidal', 'middle_name' => null, 'last_name' => 'Johanna Mae', 'email' => null],
            ],
            'RedPing: An IoT-Based Flood Detection System%' => [
                ['first_name' => 'Eugene', 'middle_name' => 'L.', 'last_name' => 'Cortes', 'email' => 'elcortes@usep.edu.ph'],
                ['first_name' => 'Shareld Rose', 'middle_name' => 'A.', 'last_name' => 'Baobao', 'email' => 'srabaobao@usep.edu.ph'],
                ['first_name' => 'Dyesebel', 'middle_name' => 'T.', 'last_name' => 'Centillas', 'email' => 'dtcentillas@usep.edu.ph'],
            ],
            'IoTae: A WEB BASED MONITORING SYSTEM FOR%' => [
                ['first_name' => 'Jay Mark', 'middle_name' => 'H.', 'last_name' => 'Taganahan', 'email' => null],
                ['first_name' => 'Quenie Marie', 'middle_name' => 'D.', 'last_name' => 'Penanueva', 'email' => null],
                ['first_name' => 'Mark', 'middle_name' => 'B.', 'last_name' => 'Lumen', 'email' => null],
            ],
            'Project T-RAT: An IoT Based Smart-Trapper for Rats%' => [
                ['first_name' => 'Jay Ar', 'middle_name' => null, 'last_name' => 'Drilon', 'email' => null],
                ['first_name' => 'Romel', 'middle_name' => 'M.', 'last_name' => 'Hermoso', 'email' => null],
            ],
            'HAPPAG: A MOBILE APPLICATION CONNECTING FOOD DONORS%' => [
                ['first_name' => 'Mary Rose', 'middle_name' => 'C.', 'last_name' => 'Adorable', 'email' => null],
                ['first_name' => 'Faye Hazel', 'middle_name' => 'V.', 'last_name' => 'Remis', 'email' => null],
                ['first_name' => 'Aries Dominic', 'middle_name' => 'H.', 'last_name' => 'Mahinay', 'email' => null],
            ],
            'DIPRICE: A RICE QUALITY IDENTIFIER%' => [
                ['first_name' => 'Raymund', 'middle_name' => 'F.', 'last_name' => 'Ontolan', 'email' => null],
                ['first_name' => 'Jazzy Bert', 'middle_name' => 'S.', 'last_name' => 'Viernes', 'email' => null],
            ],
            'HeHaSpot: A Human Health Hazard%' => [
                ['first_name' => 'Vil Marie', 'middle_name' => 'A.', 'last_name' => 'Agcol', 'email' => null],
                ['first_name' => 'Ellen Mae', 'middle_name' => 'G.', 'last_name' => 'Calzada', 'email' => null],
                ['first_name' => 'Junard John', 'middle_name' => 'C.', 'last_name' => 'Clenista', 'email' => null],
            ],
            'SPEEDISOR: A WEB AND MOBILE%' => [
                ['first_name' => 'Pauline Grace', 'middle_name' => 'C.', 'last_name' => 'Albutra', 'email' => null],
                ['first_name' => 'Rennjo', 'middle_name' => 'D.', 'last_name' => 'Buquia', 'email' => null],
                ['first_name' => 'Darleen', 'middle_name' => 'S.', 'last_name' => 'Lungay', 'email' => null],
            ],
            'HALINON: A CROWDSOURCED PRODUCT%' => [
                ['first_name' => 'Jumar', 'middle_name' => 'H.', 'last_name' => 'Dulay', 'email' => null],
                ['first_name' => 'Jehoiakim Jade', 'middle_name' => 'C.', 'last_name' => 'Esgana', 'email' => null],
                ['first_name' => 'John Jay', 'middle_name' => 'A.', 'last_name' => 'Rivera', 'email' => null],
            ],
            'BreakApp: A WEB AND%' => [
                ['first_name' => 'Harris', 'middle_name' => 'B.', 'last_name' => 'Carreon', 'email' => null],
                ['first_name' => 'Kent Charles', 'middle_name' => null, 'last_name' => 'Cutamora', 'email' => null],
                ['first_name' => 'Hyacinth Faye', 'middle_name' => 'A.', 'last_name' => 'Tabasa', 'email' => null],
            ],
            'DRIVECARE: A WEARABLE DEVICE%' => [
                ['first_name' => 'Allen Grace', 'middle_name' => 'S.', 'last_name' => 'Decierdo', 'email' => null],
                ['first_name' => 'Queenie', 'middle_name' => 'L.', 'last_name' => 'Dumangas', 'email' => null],
                ['first_name' => 'Kristine Mae', 'middle_name' => 'D.', 'last_name' => 'Merecuelo', 'email' => null],
            ],
            'TransBraille: A MOBILE-BASED APPLICATION FOR BRAILLE%' => [
                ['first_name' => 'Angelica', 'middle_name' => 'B.', 'last_name' => 'Coquilla', 'email' => null],
                ['first_name' => 'Jeelenee Jayson', 'middle_name' => 'L.', 'last_name' => 'De Claro', 'email' => null],
                ['first_name' => 'Kyle Matthew', 'middle_name' => 'C.', 'last_name' => 'Martinez', 'email' => null],
            ],
            'FINDING SAFETY IN TECHNOLOGY: A SYSTEM FOR CRIME INCIDENT REPORTING%' => [
                ['first_name' => 'Jahmicah Nissi', 'middle_name' => 'F.', 'last_name' => 'Boo', 'email' => null],
                ['first_name' => 'Mary Elisse', 'middle_name' => 'G.', 'last_name' => 'Gonzales', 'email' => null],
                ['first_name' => 'Maruela Angela', 'middle_name' => 'A.', 'last_name' => 'Regalado', 'email' => null],
            ],
            'SAFE210T: AN AUTOMATED WATER QUALITY FILTRATION SYSTEM%' => [
                ['first_name' => 'Joshua Antonio', 'middle_name' => 'N.', 'last_name' => 'Castro', 'email' => null],
                ['first_name' => 'Elnathan Timothy', 'middle_name' => 'C.', 'last_name' => 'Dela Cruz', 'email' => null],
                ['first_name' => 'Jawad', 'middle_name' => 'L.', 'last_name' => 'Agantal', 'email' => null],
            ],
            'NailScanner: A Non-invasive Fingernail%' => [
                ['first_name' => 'Raven', 'middle_name' => 'M.', 'last_name' => 'Alinsonorin', 'email' => null],
                ['first_name' => 'Joshuaa', 'middle_name' => 'S.', 'last_name' => 'Barinan', 'email' => null],
            ],
            'AgrE: A SECURED E-COMMERCE PLATFORM%' => [
                ['first_name' => 'Daniel', 'middle_name' => 'R.', 'last_name' => 'Sabal', 'email' => 'drsabal@usep.edu.ph'],
                ['first_name' => 'Justin Jade', 'middle_name' => 'F.', 'last_name' => 'Saligumba', 'email' => 'jjfsaligumba@usep.edu.ph'],
            ],
            'PaReserve: A COSTUMIZABLE RESERVATION PLATFORM%' => [
                ['first_name' => 'Lonivel John', 'middle_name' => 'C.', 'last_name' => 'Canizares', 'email' => 'ljccanizares@usep.edu.ph'],
                ['first_name' => 'Christian Jason', 'middle_name' => 'N.', 'last_name' => 'Dimpas', 'email' => 'cndimpas@usep.edu.ph'],
                ['first_name' => 'Jason Ray', 'middle_name' => 'D.', 'last_name' => 'Uy', 'email' => 'jrduy@usep.edu.ph'],
            ],
            'PIGGYWEARIOT: A PIG COUGH SURVEILLANCE SYSTEM USING%' => [
                ['first_name' => 'Jian Luigi', 'middle_name' => 'C.', 'last_name' => 'Bollanday', 'email' => 'jlcbollanday@usep.edu.ph'],
                ['first_name' => 'Richie Floyd', 'middle_name' => 'C.', 'last_name' => 'Borleo', 'email' => 'rfcborleo@usep.edu.ph'],
                ['first_name' => 'John Loyd', 'middle_name' => 'A.', 'last_name' => 'Lao', 'email' => 'jlalao@usep.edu.ph'],
            ],
            'ANALINK: A MOBILE-BASED APPLICATION FOR DETECTING MALICIOUS%' => [
                ['first_name' => 'Katherine Joy', 'middle_name' => 'S.', 'last_name' => 'Cajetas', 'email' => 'kjscajetas@usep.edu.ph'],
                ['first_name' => 'Arman Rex', 'middle_name' => 'L.', 'last_name' => 'Lee', 'email' => 'arllee@usep.edu.ph'],
            ],
            'KAPETa: DESIGN AND DEVELOPMENT OF WEB-BASED E-COMMERCE APPLICATION FOR COFFEE%' => [
                ['first_name' => 'Richelle Anne', 'middle_name' => 'S.', 'last_name' => 'Serbo', 'email' => 'rasserbo@usep.edu.ph'],
                ['first_name' => 'Angel Menrica', 'middle_name' => 'B.', 'last_name' => 'Tubal', 'email' => 'ambtubal@usep.edu.ph'],
            ],
            'STOCKWISE: AN INVENTORY MANAGEMENT AND DEMAND FORECASTING%' => [
                ['first_name' => 'Kassandra Mariz', 'middle_name' => 'S.', 'last_name' => 'Libron', 'email' => 'kslibron@usep.edu.ph'],
                ['first_name' => 'Bazty', 'middle_name' => 'Z.', 'last_name' => 'Atanoso', 'email' => 'bcatanoso@usep.edu.ph'],
                ['first_name' => 'Andrea', 'middle_name' => 'S.', 'last_name' => 'Cosgapa', 'email' => 'ascosgapa@usep.edu.ph'],
            ],
            'PRIVACY QUEST: A DATA PRIVACY AWARENESS GAME%' => [
                ['first_name' => 'Vincent Karl Jofferson', 'middle_name' => 'D.', 'last_name' => 'Bunsay', 'email' => 'vkjdbunsay@usep.edu.ph'],
                ['first_name' => 'Clark Jasper', 'middle_name' => 'B.', 'last_name' => 'Montebon II', 'email' => 'cjbmontebon@usep.edu.ph'],
                ['first_name' => 'Ron Angelo', 'middle_name' => 'N.', 'last_name' => 'Piad', 'email' => 'ranpiad@usep.edu.ph'],
            ],
            'DESIGN AND DEVELOPMENT OF WEB-BASED DATA PRIVACY%' => [
                ['first_name' => 'Edjery Gabriel', 'middle_name' => 'C.', 'last_name' => 'Gumbao', 'email' => 'egcgumbao@usep.edu.ph'],
                ['first_name' => 'Reyjet', 'middle_name' => 'R.', 'last_name' => 'Sandoval', 'email' => 'rrsandoval@usep.edu.ph'],
            ],
            'BOXDOTS++: QUICK RESPONSE CODE SCANNER WITH MALICIOUS%' => [
                ['first_name' => 'Jainah Marie', 'middle_name' => 'C.', 'last_name' => 'Dabuan', 'email' => 'jmcdabuan@usep.edu.ph'],
                ['first_name' => 'Cindy Mae', 'middle_name' => null, 'last_name' => 'Pueblos', 'email' => 'cmpueblos197@usep.edu.ph'],
            ],
            'PREDICTALYST: A HUMAN RESOURCE MANAGEMENT SYSTEM FOR%' => [
                ['first_name' => 'Hector', 'middle_name' => 'M.', 'last_name' => 'Mataflorida', 'email' => 'hmmataflorida@usep.edu.ph'],
                ['first_name' => 'Johndell Laurence', 'middle_name' => 'B.', 'last_name' => 'Pelale', 'email' => 'jlbpelale@usep.edu.ph'],
            ],
            'PARAQUEUE: A REAL-TIME PUBLIC%' => [
                ['first_name' => 'Elijah James', 'middle_name' => 'E.', 'last_name' => 'Elacion', 'email' => 'ejeelacion@usep.edu.ph'],
                ['first_name' => 'Francis Dave', 'middle_name' => null, 'last_name' => 'Maranan', 'email' => 'fdymaranan@usep.edu.ph'],
                ['first_name' => 'Justin John', 'middle_name' => 'O.', 'last_name' => 'Mesajon', 'email' => 'jjomesajon@usep.edu.ph'],
            ],
            'LAON: LEAF COLOR CHART%' => [
                ['first_name' => 'Emma Mae', 'middle_name' => 'H.', 'last_name' => 'Canete', 'email' => 'emccanete@usep.edu.ph'],
                ['first_name' => 'Shaira', 'middle_name' => 'B.', 'last_name' => 'Celerian', 'email' => 'sbcelerian@usep.edu.ph'],
                ['first_name' => 'Joeben', 'middle_name' => 'P.', 'last_name' => 'Engalan', 'email' => 'jpengalan@usep.edu.ph'],
            ],
            'ELIAS: A PERSONAL ALIASING%' => [
                ['first_name' => 'Julius', 'middle_name' => 'B.', 'last_name' => 'Alivio', 'email' => 'jbalivio@usep.edu.ph'],
                ['first_name' => 'Francis Riedel', 'middle_name' => 'T.', 'last_name' => 'Escoton', 'email' => 'frtescoton@usep.edu.ph'],
                ['first_name' => 'Donewill Christian', 'middle_name' => 'D.', 'last_name' => 'Misal', 'email' => 'dcdmisal@usep.edu.ph'],
            ],
            'E-PAGDIWANG A CUSTOMIZABLE WEB%' => [
                ['first_name' => 'John Kelvin', 'middle_name' => 'M.', 'last_name' => 'Calunsag', 'email' => 'jkmcalunsag@usep.edu.ph'],
                ['first_name' => 'Robie Bryan', 'middle_name' => 'B.', 'last_name' => 'Jacaban', 'email' => 'rbbjacaban@usep.edu.ph'],
                ['first_name' => 'Ricci Dee', 'middle_name' => 'R.', 'last_name' => 'Tolento', 'email' => 'rdrtolento@usep.edu.ph'],
            ],
            'RECONSTRUCT: A WEB-BASED MARKETPLACE%' => [
                ['first_name' => 'Trishia Mae', 'middle_name' => 'P.', 'last_name' => 'Cabaobao', 'email' => 'tmpcabaobao@usep.edu.ph'],
                ['first_name' => 'Ivy Alexist', 'middle_name' => 'P.', 'last_name' => 'Daguplo', 'email' => 'iapdaguplo@usep.edu.ph'],
                ['first_name' => 'Kailah Shane', 'middle_name' => 'S.', 'last_name' => 'Torres', 'email' => 'ksstorres@usep.edu.ph'],
            ],
            'AEGUIDE: AN AUGMENTED REALITY AND SIMULATION%' => [
                ['first_name' => 'Guia Anne', 'middle_name' => 'G.', 'last_name' => 'Cubelo', 'email' => 'gaccubelo@usep.edu.ph'],
                ['first_name' => 'Jonah Mae', 'middle_name' => 'A.', 'last_name' => 'Gomez', 'email' => 'jmagomez@usep.edu.ph'],
            ],
            'BAGSAKAN: AN ANTI-E-COMMERCE FRAUD PLATFORM%' => [
                ['first_name' => 'Kenneth Joseph', 'middle_name' => 'V.', 'last_name' => 'Booc', 'email' => null],
                ['first_name' => 'Justine Alec', 'middle_name' => 'A.', 'last_name' => 'Go', 'email' => null],
                ['first_name' => 'Allen Ray', 'middle_name' => 'P.', 'last_name' => 'Siega', 'email' => null],
            ],
            'DAYR: A MENTAL HEALTH SELF-MONITORING%' => [
                ['first_name' => 'Hersie Jean', 'middle_name' => 'R.', 'last_name' => 'Caparas', 'email' => 'hjrcaparas@usep.edu.ph'],
                ['first_name' => 'Josephine', 'middle_name' => 'P.', 'last_name' => 'Muana', 'email' => 'jpmuana@usep.edu.ph'],
            ],
            'PROJECT TAPPERWARE: A SYSTEM FOR DETECTION OF UNAUTHORIZED ELECTRICITY CONNECTION%' => [
                ['first_name' => 'Chris Earl', 'middle_name' => 'S.', 'last_name' => 'Amar', 'email' => 'cesamar@usep.edu.ph'],
                ['first_name' => 'Joel Miller', 'middle_name' => 'M.', 'last_name' => 'Go', 'email' => null],
                ['first_name' => 'Neuqian Rhys', 'middle_name' => 'S.', 'last_name' => 'Salvador', 'email' => null],
            ],
            'E-CRUNCH: A MOBILE APPLICATION OF BASKETBALL COACH\'S ASSISTANT%' => [
                ['first_name' => 'Donell', 'middle_name' => 'D.', 'last_name' => 'Abenoja', 'email' => null],
                ['first_name' => 'Lorenzo Lolek', 'middle_name' => 'R.', 'last_name' => 'Mateo', 'email' => null],
            ],
            'KeyMouTion: A WINDOWS-BASED PROGRAMMING TOOL FOR DETECTING BOREDOM%' => [
                ['first_name' => 'Niebby Jen', 'middle_name' => 'B.', 'last_name' => 'Barez', 'email' => null],
                ['first_name' => 'Mae Amor', 'middle_name' => 'C.', 'last_name' => 'Galleto', 'email' => null],
                ['first_name' => 'Kim Clarizze', 'middle_name' => 'R.', 'last_name' => 'Remolta', 'email' => null],
            ],
            'ON THE SUITABILITY OF CACAO UNDER FUTURE CLIMATIC%' => [
                ['first_name' => 'Jonel', 'middle_name' => 'C.', 'last_name' => 'Getigan', 'email' => null],
                ['first_name' => 'Exceed Renz', 'middle_name' => 'M.', 'last_name' => 'Ramos', 'email' => null],
                ['first_name' => 'Benser Jan', 'middle_name' => 'P.', 'last_name' => 'Villanueva', 'email' => null],
            ],
            'SNAPDRIVE: AN ALTERNATIVE SECURITY SYSTEM FOR MOTORCYCLE THEFT PREVENTION%' => [
                ['first_name' => 'Joven Rey', 'middle_name' => null, 'last_name' => 'Anden', 'email' => null],
                ['first_name' => 'Ray Neal', 'middle_name' => null, 'last_name' => 'Badalo', 'email' => null],
                ['first_name' => 'Michael', 'middle_name' => 'P.', 'last_name' => 'Sy', 'email' => null],
            ],
            'SEMANTIC SEARCH ENGINE OF E-COMMERCE USING NATURAL LANGUAGE PROCESSING%' => [
                ['first_name' => 'Andrei', 'middle_name' => 'P.', 'last_name' => 'Mangaron', 'email' => 'apmangaron@usep.edu.ph'],
                ['first_name' => 'Nico', 'middle_name' => 'M.', 'last_name' => 'Mangasar', 'email' => 'nmmangasar@usep.edu.ph'],
                ['first_name' => 'Vanne Moelle', 'middle_name' => 'V.', 'last_name' => 'Valdez', 'email' => 'vmvvaldez@usep.edu.ph'],
            ],
            'DETECTING COVID-19 FAKE NEWS INFODEMIC USING HYBRID ALGORITHM%' => [
                ['first_name' => 'Yvonne Grace', 'middle_name' => 'F.', 'last_name' => 'Arandela', 'email' => 'ygfarandela@usep.edu.ph'],
                ['first_name' => 'Raschelle', 'middle_name' => 'L.', 'last_name' => 'Cossid', 'email' => 'rlcossid@usep.edu.ph'],
                ['first_name' => 'Graciella Marian', 'middle_name' => 'M.', 'last_name' => 'Pacilan', 'email' => 'gmmpacilan@usep.edu.ph'],
            ],
            'A HYBRID MACHINE LEARNING MODEL USING COMPUBOX DATA FOR%' => [
                ['first_name' => 'Earll', 'middle_name' => 'J.', 'last_name' => 'Abule', 'email' => 'ejabule@usep.edu.ph'],
                ['first_name' => 'Eugene Louis', 'middle_name' => 'D.', 'last_name' => 'Rapal', 'email' => 'eldprapal@usep.edu.ph'],
                ['first_name' => 'Christian Ken', 'middle_name' => 'A.', 'last_name' => 'Tayco', 'email' => 'ckatayco@usep.edu.ph'],
            ],
            'A PREDICTIVE MODEL FOR SEA LEVEL RISE IN PHILIPPINE%' => [
                ['first_name' => 'Marc Jules', 'middle_name' => 'B.', 'last_name' => 'Coquilla', 'email' => 'mjbcoquilla@usep.edu.ph'],
                ['first_name' => 'Joma Ray', 'middle_name' => 'A.', 'last_name' => 'Quinones', 'email' => 'jraquinones@usep.edu.ph'],
                ['first_name' => 'Haus Christian', 'middle_name' => 'C.', 'last_name' => 'Salibio', 'email' => null],
            ],
            'DETECTING POTENTIAL FISHING ZONES WITH PROBABLE TOTAL CATCH%' => [
                ['first_name' => 'Bezalel', 'middle_name' => 'O.', 'last_name' => 'Delos Reyes', 'email' => 'bodelosreyes@usep.edu.ph'],
                ['first_name' => 'Joseven', 'middle_name' => 'R.', 'last_name' => 'Francisco', 'email' => 'jrfrancisco@usep.edu.ph'],
                ['first_name' => 'Meichell Jynein', 'middle_name' => 'J.', 'last_name' => 'Managing', 'email' => 'mjjmanaging@usep.edu.ph'],
            ],            'PREDICTING WATER QUALITY USING MACHINE LEARNING IN AN%' => [
                ['first_name' => 'Nickel Snow', 'middle_name' => null, 'last_name' => 'Apique', 'email' => null],
                ['first_name' => 'Samuel', 'middle_name' => null, 'last_name' => 'Domingo III', 'email' => 'sgdomingo@usep.edu.ph'],
                ['first_name' => 'Elijah James', 'middle_name' => null, 'last_name' => 'Uytico', 'email' => 'ejsuytico@usep.edu.ph'],
            ],
            'AUTOMATED SEMANTIC SEGMENTATION OF CANCEROUS CELLS IN MAMMOGRAM%' => [
                ['first_name' => 'Isidro', 'middle_name' => 'P.', 'last_name' => 'Ampig', 'email' => 'ipampig@usep.edu.ph'],
                ['first_name' => 'Zuriel Jett', 'middle_name' => 'M.', 'last_name' => 'Leung', 'email' => 'zjmleung@usep.edu.ph'],
            ],
            'CLASSIFYING CAVENDISH BANANA MATURITY STAGE USING RESNET-18 ARCHITECTURE%' => [
                ['first_name' => 'Fritzie', 'middle_name' => 'B.', 'last_name' => 'Lor', 'email' => 'fblor@usep.edu.ph'],
                ['first_name' => 'Brylle James', 'middle_name' => null, 'last_name' => 'Sanoy', 'email' => 'bjsanoy@usep.edu.ph'],
                ['first_name' => 'Syramae', 'middle_name' => 'F.', 'last_name' => 'Siva', 'email' => 'sfsiva@usep.edu.ph'],
            ],
            'DeVICE: PREDICTION AND ANALYSIS ON THE SUBSTANCE ABUSE OF%' => [
                ['first_name' => 'Vann Rijn', 'middle_name' => 'D.', 'last_name' => 'Amarillo', 'email' => 'vrdamarillo@usep.edu.ph'],
                ['first_name' => 'John Emmanuel', 'middle_name' => 'G.', 'last_name' => 'Gapuz', 'email' => 'jeggapuz@usep.edu.ph'],
            ],
            'DURIO: AN API-BASED ANDROID MOBILE APPLICATION FOR DETECTING%' => [
                ['first_name' => 'Rovic Jade', 'middle_name' => 'P.', 'last_name' => 'Rivas', 'email' => 'rovic.rivas@usep.edu.ph'],
                ['first_name' => 'Armand Louise', 'middle_name' => 'S.', 'last_name' => 'Jusayan', 'email' => 'armand.jusayan@usep.edu.ph'],
                ['first_name' => 'Matthew Gabriel', 'middle_name' => 'B.', 'last_name' => 'Silvosa', 'email' => 'matthew.silvosa@usep.edu.ph'],
            ],
            'AUTOMATED CRYPTOCURRENCY TRADING BOT USING MACHINE LEARNING MODEL%' => [
                ['first_name' => 'Charles Andrew', 'middle_name' => 'P.', 'last_name' => 'Balbin', 'email' => 'charles.balbin@usep.edu.ph'],
                ['first_name' => 'Joshua Jay', 'middle_name' => 'G.', 'last_name' => 'Ungab', 'email' => 'joshua.ungab@usep.edu.ph'],
                ['first_name' => 'Justine Riva', 'middle_name' => 'F.', 'last_name' => 'Unson', 'email' => 'justine.unson@usep.edu.ph'],
            ],
            'DETECTION POTENTIAL FISHING ZONES IN DAVAO GULF: AN APPLICATION OF GEOSPATIAL%' => [
                ['first_name' => 'Denver Fred', 'middle_name' => 'A.', 'last_name' => 'De Gracia', 'email' => 'denver.degracia@usep.edu.ph'],
                ['first_name' => 'Andrew Kenan', 'middle_name' => 'A.', 'last_name' => 'Songahid', 'email' => 'andrew.songahid@usep.edu.ph'],
                ['first_name' => 'Nikko', 'middle_name' => 'L.', 'last_name' => 'Maniwang', 'email' => 'nikko.maniwang@usep.edu.ph'],
            ],
            'IDENTIFYING LIBRARY SERVICE DESIGN MODELS OF PUBLIC LIBRARY FOR%' => [
                ['first_name' => 'Chinee Lois', 'middle_name' => null, 'last_name' => 'Bergonio', 'email' => null],
                ['first_name' => 'Dave', 'middle_name' => 'M.', 'last_name' => 'Veroy', 'email' => null],
            ],
            'THE CHANGING ROLES OF LIBRARIANS TOWARDS PATRONS WITH SPECIAL NEEDS: THE CASE OF SELECTED LIBRARIES IN DAVAO REGION%' => [
                ['first_name' => 'James Harley', 'middle_name' => 'L.', 'last_name' => 'Pacaldo', 'email' => null],
                ['first_name' => 'Edward Dave', 'middle_name' => 'T.', 'last_name' => 'Almojera', 'email' => null],
            ],
            'DIGITAL RIGHTS MANAGEMENT ON THE ONLINE DATABASE OF THE USEP LIBRARY: A CHALLENGE FOR LIBRARIANS%' => [
                ['first_name' => 'Chrystel Kaye', 'middle_name' => 'H.', 'last_name' => 'Tabanao', 'email' => null],
                ['first_name' => 'Jenicel', 'middle_name' => 'E.', 'last_name' => 'Tambis', 'email' => null],
            ],
            'InProperR: INTELLECTUAL PROPERTY RIGHTS OF UNPUBLISHED MATERIALS%' => [
                ['first_name' => 'Cristy Jane', 'middle_name' => 'D.', 'last_name' => 'Madanlo', 'email' => null],
                ['first_name' => 'Carlo Rey', 'middle_name' => 'G.', 'last_name' => 'Pasinabo', 'email' => null],
            ],
            'ACCEPTABILITY LEVEL OF COLLEGE OF INFORMATION AND COMPUTING STUDENTS ON ONLINE LIBRARY SERVICES%' => [
                ['first_name' => 'Lucky Mae', 'middle_name' => 'M.', 'last_name' => 'Omega', 'email' => null],
                ['first_name' => 'CJ Nicole', 'middle_name' => null, 'last_name' => 'Suriaga', 'email' => null],
            ],
            'AN EXPLORATORY STUDY INVESTIGATING STUDENTS OUTLOOK IN PURSUING LIBRARY%' => [
                ['first_name' => 'Ella Aira Gen', 'middle_name' => 'A.', 'last_name' => 'Ajos', 'email' => null],
                ['first_name' => 'Riodelmar', 'middle_name' => 'G.', 'last_name' => 'Amboc', 'email' => null],
                ['first_name' => 'Dennis', 'middle_name' => 'C.', 'last_name' => 'Alonde', 'email' => null],
            ],
            'USeP DIGITAL LIBRARY: AN ANALYSIS OF USER%' => [
                ['first_name' => 'Jamaeca', 'middle_name' => 'I.', 'last_name' => 'Delos Cientos', 'email' => null],
                ['first_name' => 'Melanie', 'middle_name' => 'B.', 'last_name' => 'Pamaong', 'email' => null],
                ['first_name' => 'Janeth', 'middle_name' => 'R.', 'last_name' => 'Sepada', 'email' => null],
                ['first_name' => 'Mikaela Ellen Mae', 'middle_name' => 'B.', 'last_name' => 'Villocino', 'email' => null],
            ],
            'INDEXINATOR: DESIGNING A PROTOTYPE WEB-BASED%' => [
                ['first_name' => 'Kyle Jobert', 'middle_name' => 'Y.', 'last_name' => 'Bullian', 'email' => null],
                ['first_name' => 'Gerald Kenn', 'middle_name' => 'I.', 'last_name' => 'Latonio', 'email' => null],
                ['first_name' => 'Ardemer', 'middle_name' => 'E.', 'last_name' => 'Tac-an', 'email' => null],
            ],
            'MANAGING THE USEP MUSEUM: A SKILL%' => [
                ['first_name' => 'Shane Kimberly', 'middle_name' => 'Z.', 'last_name' => 'Andrade', 'email' => null],
                ['first_name' => 'Alan Joseph', 'middle_name' => 'O.', 'last_name' => 'Mapinguez', 'email' => null],
                ['first_name' => 'Catherine Joy', 'middle_name' => 'L.', 'last_name' => 'Masinading', 'email' => null],
                ['first_name' => 'Regine', 'middle_name' => 'C.', 'last_name' => 'Remulta', 'email' => null],
            ],
            'EFFECTIVENESS OF MARKETING STRATEGIES IN PROMOTING%' => [
                ['first_name' => 'Gerald', 'middle_name' => 'D.', 'last_name' => 'Basalo', 'email' => null],
                ['first_name' => 'Charisse Angeli', 'middle_name' => 'A.', 'last_name' => 'Compacion', 'email' => null],
                ['first_name' => 'Christianne Dave', 'middle_name' => 'P.', 'last_name' => 'Granaderos', 'email' => null],
            ],
            'THE LIVED EXPERIENCES OF HEALTH SCIENCES LIBRARANS IN EVIDENCE-BASED MEDICINE%' => [
                ['first_name' => 'Aubrey', 'middle_name' => 'C.', 'last_name' => 'Adarlo', 'email' => null],
                ['first_name' => 'Aira', 'middle_name' => 'M.', 'last_name' => 'Mordeno', 'email' => null],
            ],
            'THE LEVEL OF UTILIZATION AND ACCESS OF SCHOOL LIBRARY%' => [
                ['first_name' => 'John Kenth', 'middle_name' => 'P.', 'last_name' => 'Arsolon', 'email' => null],
                ['first_name' => 'Kurt Michael', 'middle_name' => 'G.', 'last_name' => 'Israel', 'email' => null],
                ['first_name' => 'Aldrich Ley', 'middle_name' => 'G.', 'last_name' => 'Cuizon', 'email' => null],
                ['first_name' => 'Garjev', 'middle_name' => 'M.', 'last_name' => 'Dupla', 'email' => null],
            ],
            'DATA VISUALIZATION OF BOOK COLLECTION%' => [
                ['first_name' => 'Annacel', 'middle_name' => 'B.', 'last_name' => 'Delima', 'email' => null],
            ],
            'DESIGNING COLINET WEB PORTAL%' => [
                ['first_name' => 'Jehoney', 'middle_name' => 'V.', 'last_name' => 'Alboroto', 'email' => null],
            ],
            'MANDIA APP: AN ASSISTIVE TOOL FOR%' => [
                ['first_name' => 'Peter', 'middle_name' => 'M.', 'last_name' => 'Cainglet', 'email' => null],
            ],
            'PLAIBRARY: AN ONLINE RESOURCE SHARING%' => [
                ['first_name' => 'Etel Ella Mae', 'middle_name' => 'H.', 'last_name' => 'Cajilig', 'email' => null],
            ],
            'FROM MEMORY TO WEB: AN INSTITUTIONAL%' => [
                ['first_name' => 'Anthony', 'middle_name' => 'P.', 'last_name' => 'Cañete', 'email' => null],
            ],
            'DEVELOPMENT OF AN ALTERNATIVE AND INTERACTIVE%' => [
                ['first_name' => 'Khristine Elaiza', 'middle_name' => 'D.', 'last_name' => 'Ruiz', 'email' => null],
            ],
            'DEVELOPMENT OF ONLINE LIBRARY BOOK FAIR%' => [
                ['first_name' => 'Fretsy Glen', 'middle_name' => 'P.', 'last_name' => 'Matalum', 'email' => null],
            ],
            'DEVELOPMENT OF WEB-BASED SUPPORT SERVICE%' => [
                ['first_name' => 'Rutchel', 'middle_name' => 'T.', 'last_name' => 'Quinte', 'email' => null],
            ],
            'C-MAP ANALYTICS: A WEB-BASED APPLICATION%' => [
                ['first_name' => 'Jayson', 'middle_name' => 'R.', 'last_name' => 'Alibango', 'email' => null],
            ],
        ];

        foreach ($researchProjects as $title => $researchers) {
            $research = Research::where('research_title', 'like', $title)->first();
            
            if ($research) {
                foreach ($researchers as $researcher) {
                    Researcher::updateOrCreate(
                        [
                            'email' => $researcher['email'],
                            'research_id' => $research->id,
                        ],
                        [
                            'first_name' => $researcher['first_name'],
                            'middle_name' => $researcher['middle_name'],
                            'last_name' => $researcher['last_name'],
                        ]
                    );
                }
            }
        }
    }
}
