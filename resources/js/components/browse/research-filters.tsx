import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import AdviserSelect from './adviser-select';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Program data structure
 */
interface Program {
  id: number;
  name: string;
  code: string;
  research_count: number;
}

/**
 * Adviser data structure
 */
interface Adviser {
  id: number;
  name: string;
  research_count: number;
}

/**
 * Filter options available
 */
interface FilterOptions {
  years: Array<{ year: number; count: number }>;
  programs: Program[];
  advisers: Adviser[];
}

/**
 * Current filter state
 */
interface Filters {
  years: number[];
  programs: number[];
  advisers: number[];
}

interface FilterSidebarProps {
  filterOptions: FilterOptions;
  currentFilters: Filters;
  onApplyFilters: (filters: Filters) => void;
  onResetFilters: () => void;
  isMobile: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  showProgramFilter?: boolean;
  showAdviserFilter?: boolean;
}

/**
 * FilterSidebar component - Multi-filter sidebar for Browse page
 * Supports Year, Program, and Adviser filtering with collapsible sections
 */
export default function FilterSidebar({
  filterOptions,
  currentFilters,
  onApplyFilters,
  onResetFilters,
  isMobile,
  isOpen = true,
  onClose,
  showProgramFilter = true,
  showAdviserFilter = true,
}: FilterSidebarProps) {
  // Local filter state (before applying)
  const [localFilters, setLocalFilters] = useState<Filters>(currentFilters);

  // Collapsible section states
  const [yearOpen, setYearOpen] = useState(true);
  const [programOpen, setProgramOpen] = useState(true);
  const [adviserOpen, setAdviserOpen] = useState(true);

  // Update local state when currentFilters changes (but not if we have unsaved local changes)
  useEffect(() => {
    // Only sync if filters are not dirty (haven't been locally modified)
    const isCurrentlyDirty = (
      JSON.stringify([...localFilters.years].sort()) !== JSON.stringify([...currentFilters.years].sort()) ||
      JSON.stringify([...localFilters.programs].sort()) !== JSON.stringify([...currentFilters.programs].sort()) ||
      JSON.stringify([...localFilters.advisers].sort()) !== JSON.stringify([...currentFilters.advisers].sort())
    );
    
    if (!isCurrentlyDirty) {
      setLocalFilters(currentFilters);
    }
  }, [currentFilters]);

  /**
   * Calculate total active filter count
   */
  const activeFilterCount =
    localFilters.years.length +
    (showProgramFilter ? localFilters.programs.length : 0) +
    (showAdviserFilter ? localFilters.advisers.length : 0);

  const isDirty = (
    JSON.stringify([...localFilters.years].sort()) !== JSON.stringify([...currentFilters.years].sort()) ||
    (showProgramFilter && JSON.stringify([...localFilters.programs].sort()) !== JSON.stringify([...currentFilters.programs].sort())) ||
    (showAdviserFilter && JSON.stringify([...localFilters.advisers].sort()) !== JSON.stringify([...currentFilters.advisers].sort()))
  );

  /**
   * Handle year checkbox change
   */
  const handleYearChange = (year: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      years: prev.years.includes(year)
        ? prev.years.filter((y) => y !== year)
        : [...prev.years, year],
    }));
  };

  /**
   * Handle "Select All" for years
   */
  const handleYearSelectAll = () => {
    setLocalFilters((prev) => ({
      ...prev,
      years: filterOptions.years.map((y) => y.year),
    }));
  };

  /**
   * Handle "Clear All" for years
   */
  const handleYearClearAll = () => {
    setLocalFilters((prev) => ({
      ...prev,
      years: [],
    }));
  };

  /**
   * Handle program checkbox change
   */
  const handleProgramChange = (programId: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      programs: prev.programs.includes(programId)
        ? prev.programs.filter((p) => p !== programId)
        : [...prev.programs, programId],
    }));
  };

  /**
   * Handle "Select All" for programs
   */
  const handleProgramSelectAll = () => {
    setLocalFilters((prev) => ({
      ...prev,
      programs: filterOptions.programs.map((p) => p.id),
    }));
  };

  /**
   * Handle "Clear All" for programs
   */
  const handleProgramClearAll = () => {
    setLocalFilters((prev) => ({
      ...prev,
      programs: [],
    }));
  };

  /**
   * Handle adviser selection change
   */
  const handleAdviserChange = (selectedIds: number[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      advisers: selectedIds,
    }));
  };

  /**
   * Apply filters and close mobile drawer
   */
  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    if (isMobile && onClose) {
      onClose();
    }
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    const emptyFilters: Filters = { years: [], programs: [], advisers: [] };
    setLocalFilters(emptyFilters);
    onResetFilters();
    if (isMobile && onClose) {
      onClose();
    }
  };

  /**
   * Collapsible section component
   */
  const CollapsibleSection = ({
    title,
    isOpen,
    onToggle,
    children,
  }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 dark:border-neutral-800 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 md:py-4 px-3 md:px-4 hover:bg-gray-50 dark:hover:bg-neutral-900/50 transition-colors"
      >
        <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3 md:px-4 md:pb-4">{children}</div>}
    </div>
  );

  /**
   * Checkbox group with Select/Clear All
   */
  const CheckboxGroup = <T,>({
    items,
    selectedIds,
    getId,
    onItemChange,
    onSelectAll,
    onClearAll,
    renderLabel,
    idPrefix,
  }: {
    items: T[];
    selectedIds: number[];
    getId: (item: T) => number;
    onItemChange: (id: number) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
    renderLabel: (item: T) => string;
    idPrefix: string;
  }) => {
    const allSelected = items.length > 0 && selectedIds.length === items.length;

    return (
      <div className="space-y-3">
        {/* Select All / Clear All buttons */}
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={allSelected}
            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <button
            type="button"
            onClick={onClearAll}
            disabled={selectedIds.length === 0}
            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed font-medium"
          >
            Clear All
          </button>
        </div>

        {/* Checkbox list */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => {
            const itemId = getId(item);
            const isChecked = selectedIds.includes(itemId);
            const checkboxId = `${idPrefix}-${itemId}`;

            return (
              <div key={itemId} className="flex items-center space-x-2">
                <Checkbox id={checkboxId} checked={isChecked} onCheckedChange={() => onItemChange(itemId)} />
                <label htmlFor={checkboxId} className="text-xs md:text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer">
                  {renderLabel(item)}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Sidebar content
   */
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800" role="region" aria-labelledby="filters-heading">
      {/* Header */}
      {/* Mobile optimization: compact header padding */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 id="filters-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
          <span className="text-xs text-gray-600 dark:text-gray-400">({activeFilterCount})</span>
          {isDirty && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-white bg-orange-500 dark:bg-orange-600 rounded-full">Unsaved</span>
          )}
        </div>
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="py-1 px-2 hover:bg-gray-100 dark:hover:bg-neutral-900/50 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      {/* Filter sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Year Filter */}
        <CollapsibleSection
          title="Year"
          isOpen={yearOpen}
          onToggle={() => setYearOpen(!yearOpen)}
        >
          <CheckboxGroup
            items={[...filterOptions.years].sort((a, b) => b.year - a.year)}
            selectedIds={localFilters.years}
            onItemChange={handleYearChange}
            onSelectAll={handleYearSelectAll}
            onClearAll={handleYearClearAll}
            getId={(item) => item.year}
            renderLabel={(item) => `${item.year} (${item.count ?? 0})`}
            idPrefix="year"
          />
        </CollapsibleSection>

        {showProgramFilter && (
          <CollapsibleSection
            title="Program"
            isOpen={programOpen}
            onToggle={() => setProgramOpen(!programOpen)}
          >
            <CheckboxGroup
              items={filterOptions.programs}
              selectedIds={localFilters.programs}
              getId={(item) => item.id}
              onItemChange={handleProgramChange}
              onSelectAll={handleProgramSelectAll}
              onClearAll={handleProgramClearAll}
              renderLabel={(item) => `${item.name} (${item.research_count})`}
              idPrefix="program"
            />
          </CollapsibleSection>
        )}

        {showAdviserFilter && (
          <CollapsibleSection
            title="Adviser"
            isOpen={adviserOpen}
            onToggle={() => setAdviserOpen(!adviserOpen)}
          >
            <AdviserSelect
              advisers={filterOptions.advisers}
              selectedAdviserIds={localFilters.advisers}
              onChange={handleAdviserChange}
            />
          </CollapsibleSection>
        )}
      </div>

      {/* Action buttons - Sticky at bottom */}
      {/* Mobile optimization: compact bottom actions */}
      <div className="border-t border-gray-200 dark:border-neutral-800 p-3 md:p-4 space-y-2 bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={handleResetFilters}
          disabled={activeFilterCount === 0}
          className="w-full text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          Clear All Filters
        </button>
        <button
          type="button"
          onClick={handleApplyFilters}
          className={`w-full px-4 py-2 md:py-2.5 text-white text-sm font-medium rounded-lg transition-colors duration-200 ${isDirty ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500'} focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  // Desktop: static sidebar
  if (!isMobile) {
    return (
      <aside className="w-72 h-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm" aria-label="Filter sidebar">
        {sidebarContent}
      </aside>
    );
  }

  // Mobile: bottom sheet drawer with backdrop
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`
          fixed bottom-0 left-0 right-0 z-60 w-full max-h-[70vh]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          overflow-hidden
        `}
        aria-label="Filter sidebar"
      >
        <div className="rounded-t-lg border border-gray-200 dark:border-gray-700 shadow-2xl bg-white dark:bg-gray-800 h-[70vh] flex flex-col">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
