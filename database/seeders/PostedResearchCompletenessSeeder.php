<?php

namespace Database\Seeders;

use App\Models\Agenda;
use App\Models\Keyword;
use App\Models\Research;
use App\Models\Sdg;
use App\Models\Srig;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Completes historical/demo Posted records that predate the current posting
 * workflow. This is deliberately additive and idempotent: it never replaces
 * supplied files, panelists, tags, or keywords.
 */
class PostedResearchCompletenessSeeder extends Seeder
{
    public function run(): void
    {
        $seedUploaderId = User::query()
            ->where('email', 'emdmenil00759@usep.edu.ph')
            ->value('id');
        $staffId = User::query()
            ->whereHas('roles', fn ($query) => $query->where('name', 'MCIIS Staff'))
            ->value('id');

        if (! $seedUploaderId || ! $staffId) {
            $this->command?->warn('Skipped posted research completeness backfill: required seed accounts are missing.');

            return;
        }

        $agendaIds = Agenda::query()->orderBy('id')->pluck('id')->all();
        $sdgIds = Sdg::query()->orderBy('id')->pluck('id')->all();
        $srigIds = Srig::query()->orderBy('id')->pluck('id')->all();
        $keywordIds = Keyword::query()->orderBy('id')->pluck('id')->all();

        if ($agendaIds === [] || $sdgIds === [] || $srigIds === [] || $keywordIds === []) {
            $this->command?->warn('Skipped posted research completeness backfill: reference tags or keywords are missing.');

            return;
        }

        Research::query()
            ->posted()
            ->where('uploaded_by', $seedUploaderId)
            ->orderBy('id')
            ->each(function (Research $research, int $index) use ($staffId, $agendaIds, $sdgIds, $srigIds, $keywordIds): void {
                $legacyAttributes = [];

                if (! $research->panelists()->exists() && ! $research->panelists_unavailable_legacy_at) {
                    $legacyAttributes['panelists_unavailable_legacy_at'] = now();
                    $legacyAttributes['panelists_unavailable_legacy_by'] = $staffId;
                }
                if (blank($research->research_approval_sheet) && ! $research->approval_sheet_unavailable_legacy_at) {
                    $legacyAttributes['approval_sheet_unavailable_legacy_at'] = now();
                    $legacyAttributes['approval_sheet_unavailable_legacy_by'] = $staffId;
                }
                if (blank($research->research_manuscript) && ! $research->manuscript_unavailable_legacy_at) {
                    $legacyAttributes['manuscript_unavailable_legacy_at'] = now();
                    $legacyAttributes['manuscript_unavailable_legacy_by'] = $staffId;
                }

                if ($legacyAttributes !== []) {
                    $research->forceFill($legacyAttributes)->save();
                }

                if (! $research->agendas()->exists()) {
                    $research->agendas()->syncWithoutDetaching([$agendaIds[$index % count($agendaIds)]]);
                }
                if (! $research->sdgs()->exists()) {
                    $research->sdgs()->syncWithoutDetaching([$sdgIds[$index % count($sdgIds)]]);
                }
                if (! $research->srigs()->exists()) {
                    $research->srigs()->syncWithoutDetaching([$srigIds[$index % count($srigIds)]]);
                }
                if (! $research->keywords()->exists()) {
                    $research->keywords()->syncWithoutDetaching([$keywordIds[$index % count($keywordIds)]]);
                }
            });
    }
}
