<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomAlignmentCategoryRequest;
use App\Http\Requests\CustomAlignmentEntryRequest;
use App\Models\CustomAlignmentCategory;
use App\Models\CustomAlignmentEntry;
use Illuminate\Http\RedirectResponse;

/**
 * Manages admin-defined alignment categories and their entries.
 *
 * Kept separate from ResearchAlignmentManagementController, which owns the
 * built-in SDG, SRIG, and Agenda alignments.
 */
class CustomAlignmentController extends Controller
{
    public function storeCategory(CustomAlignmentCategoryRequest $request): RedirectResponse
    {
        $category = CustomAlignmentCategory::query()->create($request->validated());

        return back()->with('success', "Category \"{$category->name}\" created successfully.");
    }

    public function updateCategory(CustomAlignmentCategoryRequest $request, CustomAlignmentCategory $customCategory): RedirectResponse
    {
        $customCategory->update($request->validated());

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroyCategory(CustomAlignmentCategory $customCategory): RedirectResponse
    {
        $researchCount = $customCategory->linkedResearchCount();
        if ($researchCount > 0) {
            return back()->withErrors([
                'delete' => "The \"{$customCategory->name}\" category cannot be deleted because {$researchCount} research record(s) are linked to it.",
            ]);
        }

        $entryCount = $customCategory->entries()->count();
        if ($entryCount > 0) {
            return back()->withErrors([
                'delete' => "The \"{$customCategory->name}\" category cannot be deleted because it still has {$entryCount} entr".($entryCount === 1 ? 'y' : 'ies').'. Delete its entries first.',
            ]);
        }

        $customCategory->delete();

        return back()->with('success', 'Category deleted successfully.');
    }

    public function storeEntry(CustomAlignmentEntryRequest $request, CustomAlignmentCategory $customCategory): RedirectResponse
    {
        $customCategory->entries()->create($request->validated());

        return back()->with('success', 'Entry created successfully.');
    }

    public function updateEntry(CustomAlignmentEntryRequest $request, CustomAlignmentCategory $customCategory, CustomAlignmentEntry $entry): RedirectResponse
    {
        $entry->update($request->validated());

        return back()->with('success', 'Entry updated successfully.');
    }

    public function destroyEntry(CustomAlignmentCategory $customCategory, CustomAlignmentEntry $entry): RedirectResponse
    {
        $researchCount = $entry->researches()->count();
        if ($researchCount > 0) {
            return back()->withErrors([
                'delete' => "This entry cannot be deleted because {$researchCount} research record(s) use it.",
            ]);
        }

        $entry->delete();

        return back()->with('success', 'Entry deleted successfully.');
    }
}
