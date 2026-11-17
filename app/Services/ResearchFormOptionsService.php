<?php

namespace App\Services;

use App\Models\Agenda;
use App\Models\Faculty;
use App\Models\Keyword;
use App\Models\Program;
use App\Models\Sdg;
use App\Models\Srig;
use Illuminate\Database\Eloquent\Collection;

class ResearchFormOptionsService
{
    public function forResearchForm(bool $includeFacultyPosition = false): array
    {
        return [
            'programs' => Program::select('id', 'name', 'code')->orderBy('name')->get(),
            'faculties' => $this->faculties($includeFacultyPosition),
            'keywordOptions' => Keyword::select('id', 'keyword_name')->orderBy('keyword_name')->get(),
            'agendas' => Agenda::select('id', 'name')->orderBy('name')->get(),
            'sdgs' => Sdg::select('id', 'name')->orderBy('name')->get(),
            'srigs' => Srig::select('id', 'name')->orderBy('name')->get(),
        ];
    }

    public function forResearchEditor(): array
    {
        $options = $this->forResearchForm();
        $options['keywords'] = $options['keywordOptions'];
        unset($options['keywordOptions']);

        return $options;
    }

    private function faculties(bool $includePosition): Collection
    {
        $columns = ['id', 'first_name', 'middle_name', 'last_name'];
        if ($includePosition) {
            $columns[] = 'position';
        }

        return Faculty::select($columns)->orderBy('last_name')->get();
    }
}
