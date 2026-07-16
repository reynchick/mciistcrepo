<?php

namespace Database\Seeders;

use App\Models\Agenda;
use App\Models\Research;
use App\Models\SDG;
use App\Models\SRIG;
use Illuminate\Database\Seeder;

class ResearchThematicSeeder extends Seeder
{
    /**
     * Assign random SDG, SRIG, and Agenda tags to every research that has none.
     * Idempotent: a research that already has tags for a relation is skipped
     * for that relation, so re-running never duplicates or reshuffles.
     */
    public function run(): void
    {
        $sdgIds = SDG::pluck('id');
        $srigIds = SRIG::pluck('id');
        $agendaIds = Agenda::pluck('id');

        if ($sdgIds->isEmpty() || $srigIds->isEmpty() || $agendaIds->isEmpty()) {
            $this->command?->warn('Reference tables are empty — run AgendaSeeder, SDGSeeder, and SRIGSeeder first.');
            return;
        }

        $tagged = ['sdgs' => 0, 'srigs' => 0, 'agendas' => 0];

        Research::query()
            ->with(['sdgs:id', 'srigs:id', 'agendas:id'])
            ->chunkById(100, function ($researches) use ($sdgIds, $srigIds, $agendaIds, &$tagged) {
                foreach ($researches as $research) {
                    if ($research->sdgs->isEmpty()) {
                        $research->sdgs()->attach($sdgIds->random(random_int(1, 3))->all());
                        $tagged['sdgs']++;
                    }

                    if ($research->srigs->isEmpty()) {
                        $research->srigs()->attach($srigIds->random(random_int(1, min(2, $srigIds->count())))->all());
                        $tagged['srigs']++;
                    }

                    if ($research->agendas->isEmpty()) {
                        $research->agendas()->attach($agendaIds->random(random_int(1, 2))->all());
                        $tagged['agendas']++;
                    }
                }
            });

        $this->command?->info("Tagged {$tagged['sdgs']} researches with SDGs, {$tagged['srigs']} with SRIGs, {$tagged['agendas']} with Agendas.");
    }
}
