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
                'name' => 'SRIG1: Software Engineering',
                'description' => 'Software Engineering is the systematic application of principles, methodologies, and techniques to the design, development, testing, deployment, and maintenance of software systems. It involves the application of discipline, quantifiable, and systematic approaches to the entire software development lifecycle to ensure the creation of high-quality, reliable, and maintainable software products.'
            ],
            [
                'name' => 'SRIG2: Data Science',
                'description' => 'This encompasses the study of algorithms, systems, and tools for collecting, storing, processing, analyzing, and visualizing data. It involves applying techniques from statistics, machine learning, artificial intelligence, and database systems to address complex problems related to data. Application includes but is not limited to predictive modeling, pattern recognition, natural language processing, and data mining. Data science also includes the development of algorithms and systems to extract meaningful information from structured and unstructured data, which can be used to make data-driven decisions and improve processes in various domains.
                                    In library and information science, data science focuses on managing and analyzing large amounts of digital information, such as library catalogs, digital repositories, bibliographic databases, and user-generated content. Data science techniques are used to organize, classify, retrieve, and analyze information effectively, enabling librarians and information professionals to provide better services and resources to users. This may involve tasks such as text mining, information retrieval, citation analysis, metadata management, and recommendation systems. Data science in LIS also plays a crucial role in digital preservation, data curation, and information governance, ensuring the long-term accessibility and usability of digital collections and archives.'
            ],
            [
                'name' => 'SRIG3: Artificial Intelligence',
                'description' => 'AI systems are information-processing technologies that integrate models and algorithms that produce a capacity to learn and perform cognitive tasks leading to outcomes such as prediction and decision-making in material and virtual environments. AI systems are designed to operate with varying degrees of autonomy by utilizing knowledge modeling and representation and by exploiting data and calculating correlations. AI systems may include several methods, such as but not limited to:
                                    (i) machine learning, including deep learning and reinforcement learning;
                                    (ii) machine reasoning, including planning, scheduling, knowledge representation, and reasoning, search, and optimization.
                                    AI systems can be used in cyber-physical systems, including the Internet of Things, robotic systems, social robotics, and human-computer interfaces, which involve control, perception, the processing of data collected by sensors, and the operation of actuators in the environment in which AI systems work.',
            ],
            [
                'name' => 'SRIG4: Cybersecurity',
                'description' => 'Cybersecurity is the practice of protecting computer systems, networks, data, and information from unauthorized access, use, disclosure, disruption, modification, or destruction. It encompasses a wide range of technologies, processes, and practices designed to safeguard digital assets and mitigate the risks associated with cyber threats and attacks.',
            ],
        ];

        foreach ($srigs as $srig) {
            SRIG::create($srig);
        }
    }
}
