<?php

namespace Database\Seeders;

use App\Models\ReportFormat;
use Illuminate\Database\Seeder;

class ReportFormatSeeder extends Seeder
{
    public function run(): void
    {
        $formats = [
            ['name' => 'PDF', 'description' => 'Portable Document Format'],
            ['name' => 'Word', 'description' => 'Microsoft Word Document'],
            ['name' => 'Excel', 'description' => 'Microsoft Excel Spreadsheet'],
        ];

        foreach ($formats as $format) {
            ReportFormat::create($format);
        }
    }
}