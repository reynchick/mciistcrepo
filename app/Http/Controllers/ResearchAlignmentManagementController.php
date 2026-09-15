<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreResearchAlignmentCategoryRequest;
use App\Http\Requests\StoreResearchAlignmentEntryRequest;
use App\Models\ResearchAlignmentCategory;
use App\Models\ResearchAlignmentEntry;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ResearchAlignmentManagementController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', ResearchAlignmentCategory::class);

        return Inertia::render('admin/research-alignments/index', [
            'categories' => ResearchAlignmentCategory::query()
                ->with('entries')
                ->orderBy('name')
                ->get()
                ->map(function (ResearchAlignmentCategory $category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'description' => $category->description,
                        'entries' => $category->entries()->orderBy('name')->get()->map(function (ResearchAlignmentEntry $entry) {
                            return [
                                'id' => $entry->id,
                                'name' => $entry->name,
                                'code' => $entry->code,
                                'description' => $entry->description,
                            ];
                        })->values()->all(),
                    ];
                })->values()->all(),
        ]);
    }

    public function storeCategory(StoreResearchAlignmentCategoryRequest $request): RedirectResponse
    {
        ResearchAlignmentCategory::query()->create($request->validated());

        return back()->with('success', 'Alignment category created successfully.');
    }

    public function storeEntry(StoreResearchAlignmentEntryRequest $request, ResearchAlignmentCategory $category): RedirectResponse
    {
        $this->authorize('update', $category);

        $category->entries()->create($request->validated());

        return back()->with('success', 'Alignment entry created successfully.');
    }

    public function destroyCategory(ResearchAlignmentCategory $category): RedirectResponse
    {
        $this->authorize('delete', $category);

        if ($category->entries()->exists() || $category->researches()->exists()) {
            return back()->withErrors(['category' => 'This category cannot be deleted because it is linked to research records.']);
        }

        $category->delete();

        return back()->with('success', 'Alignment category deleted successfully.');
    }

    public function destroyEntry(ResearchAlignmentEntry $entry): RedirectResponse
    {
        $this->authorize('delete', $entry->category);

        if ($entry->researches()->exists()) {
            return back()->withErrors(['entry' => 'This alignment entry cannot be deleted because it is linked to research records.']);
        }

        $entry->delete();

        return back()->with('success', 'Alignment entry deleted successfully.');
    }
}