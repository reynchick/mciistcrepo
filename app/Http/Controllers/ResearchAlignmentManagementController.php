<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAgendaRequest;
use App\Http\Requests\StoreSDGRequest;
use App\Http\Requests\StoreSRIGRequest;
use App\Http\Requests\UpdateAgendaRequest;
use App\Http\Requests\UpdateSDGRequest;
use App\Http\Requests\UpdateSRIGRequest;
use App\Models\Agenda;
use App\Models\SDG;
use App\Models\SRIG;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ResearchAlignmentManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/research-alignments/index', [
            'sdgs' => SDG::query()
                ->withCount('researches')
                ->orderBy('name')
                ->get()
                ->values(),
            'srigs' => SRIG::query()
                ->withCount('researches')
                ->orderBy('name')
                ->get()
                ->values(),
            'agendas' => Agenda::query()
                ->withCount('researches')
                ->orderBy('name')
                ->get()
                ->values(),
        ]);
    }

    public function storeSdg(StoreSDGRequest $request): RedirectResponse
    {
        SDG::query()->create($request->validated());

        return back()->with('success', 'SDG created successfully.');
    }

    public function updateSdg(UpdateSDGRequest $request, SDG $sdg): RedirectResponse
    {
        $sdg->update($request->validated());

        return back()->with('success', 'SDG updated successfully.');
    }

    public function destroySdg(SDG $sdg): RedirectResponse
    {
        return $this->destroyUnused($sdg, 'SDG');
    }

    public function storeSrig(StoreSRIGRequest $request): RedirectResponse
    {
        SRIG::query()->create($request->validated());

        return back()->with('success', 'SRIG created successfully.');
    }

    public function updateSrig(UpdateSRIGRequest $request, SRIG $srig): RedirectResponse
    {
        $srig->update($request->validated());

        return back()->with('success', 'SRIG updated successfully.');
    }

    public function destroySrig(SRIG $srig): RedirectResponse
    {
        return $this->destroyUnused($srig, 'SRIG');
    }

    public function storeAgenda(StoreAgendaRequest $request): RedirectResponse
    {
        Agenda::query()->create($request->validated());

        return back()->with('success', 'Agenda created successfully.');
    }

    public function updateAgenda(UpdateAgendaRequest $request, Agenda $agenda): RedirectResponse
    {
        $agenda->update($request->validated());

        return back()->with('success', 'Agenda updated successfully.');
    }

    public function destroyAgenda(Agenda $agenda): RedirectResponse
    {
        return $this->destroyUnused($agenda, 'Agenda');
    }

    /** @param SDG|SRIG|Agenda $alignment */
    private function destroyUnused(SDG|SRIG|Agenda $alignment, string $label): RedirectResponse
    {
        $researchCount = $alignment->researches()->count();

        if ($researchCount > 0) {
            return back()->withErrors([
                'delete' => "This {$label} cannot be deleted because {$researchCount} research record(s) use it.",
            ]);
        }

        $alignment->delete();

        return back()->with('success', "{$label} deleted successfully.");
    }
}
