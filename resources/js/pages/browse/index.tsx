import React, { useEffect, useState } from 'react';
import { Head, router, useRemember } from '@inertiajs/react';
import AppLayout from '@/layouts/app/app-layout';
import { Filter, LayoutGrid, List as ListIcon } from 'lucide-react';
import { ChevronUp } from 'lucide-react';
import SearchBar from '@/components/shared/search-bar';
import { SortSelect } from '@/components/shared/sort-select';
import FilterSidebar from '@/components/browse/research-filters';
import ResearchGrid from '@/components/browse/research-grid';
import ResearchDetailsModal from '@/components/browse/research-details-modal';
import { ResearchList } from '@/components/browse/research-list';
import Pagination from '@/components/shared/pagination';
import EmptyState from '@/components/shared/empty-state';

/**
 * Research data structure
 */
interface Research {
  id: number;
  title: string;
  abstract: string;
  keywords: string;
  year: number;
  program: {
    id: number;
    code: string;
    name: string;
  };
  researchers: Array<{
    id: number;
    name: string;
  }>;
  adviser: {
    id: number;
    name: string;
  };
  research_approval_sheet?: string | null;
  research_manuscript?: string | null;
  access_count?: number;
}

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
 * Paginated data structure from Laravel
 */
interface PaginatedData<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

/**
 * Filter state
 */
interface Filters {
  search: string;
  years: number[];
  programs: number[];
  advisers: number[];
  page: number;
  per_page: number;
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
 * Page props from Laravel Inertia controller
 */
interface BrowsePageProps {
  researches: PaginatedData<Research>;
  filters: Filters;
  filterOptions: FilterOptions;
}

interface BackendKeyword { keyword_name: string }
interface BackendPerson { id: number; first_name?: string; middle_name?: string; last_name?: string; name?: string }
interface BackendProgram { id: number; name?: string; code?: string; research_count?: number; researches_count?: number }
interface BackendAdviser extends BackendPerson { research_count?: number; advised_researches_count?: number }
interface BackendResearch {
  id: number;
  title?: string;
  research_title?: string;
  abstract?: string;
  research_abstract?: string;
  year?: number;
  published_year?: number;
  program?: BackendProgram;
  adviser?: BackendAdviser;
  researchers?: BackendPerson[];
  keywords?: BackendKeyword[] | string;
  research_approval_sheet?: string | null;
  research_manuscript?: string | null;
  access_count?: number;
}
interface BackendPaginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

/**
 * Browse page component - Main research browsing interface
 * Features search, filtering, pagination, and responsive design
 */
export default function Browse({ researches, filters, filterOptions }: BrowsePageProps) {
  // Mobile filter sidebar state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  // Persist filter sidebar visibility between Inertia navigations
  const [showFilters, setShowFilters] = useRemember(false, 'browse.showFilters');
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Loading state during Inertia requests
  const [isLoading, setIsLoading] = useState(false);
  
  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  const rawFilters = filters as unknown as Partial<Filters> & { page?: number | string; per_page?: number | string };
  const safeFilters: Filters = {
    search: typeof rawFilters.search === 'string' ? rawFilters.search : '',
    years: Array.isArray(rawFilters.years)
      ? (rawFilters.years as unknown[])
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n))
      : [],
    programs: Array.isArray(rawFilters.programs)
      ? (rawFilters.programs as unknown[])
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n))
      : [],
    advisers: Array.isArray(rawFilters.advisers)
      ? (rawFilters.advisers as unknown[])
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n))
      : [],
    page: Number.isFinite(Number(rawFilters.page)) && Number(rawFilters.page) > 0 ? Number(rawFilters.page) : 1,
    per_page: Number.isFinite(Number(rawFilters.per_page)) && Number(rawFilters.per_page) > 0 ? Number(rawFilters.per_page) : 12,
  };

  const normalizedFilterOptions: FilterOptions = {
    years: Array.isArray((filterOptions as unknown as { years?: Array<number | { year: number; count: number }> })?.years)
      ? ((filterOptions as unknown as { years: Array<number | { year: number; count: number }> }).years).map((y) =>
          typeof y === 'number' ? { year: y, count: 0 } : y,
        )
      : [],
    programs: Array.isArray((filterOptions as unknown as { programs?: BackendProgram[] })?.programs)
      ? ((filterOptions as unknown as { programs: BackendProgram[] }).programs).map((p) => ({
          id: p.id,
          name: p.name ?? p.code ?? '',
          code: p.code ?? p.name ?? '',
          research_count: Number(p.research_count ?? p.researches_count ?? 0),
        }))
      : [],
    advisers: Array.isArray((filterOptions as unknown as { advisers?: BackendAdviser[] })?.advisers)
      ? ((filterOptions as unknown as { advisers: BackendAdviser[] }).advisers).map((a) => ({
          id: a.id,
          name: a.name ?? [a.last_name, a.first_name].filter(Boolean).join(', '),
          research_count: Number(a.research_count ?? a.advised_researches_count ?? 0),
        }))
      : [],
  };

  const uiResearches = Array.isArray((researches as unknown as BackendPaginated<BackendResearch>)?.data)
    ? ((researches as unknown as BackendPaginated<BackendResearch>).data).map((r) => ({
      id: r.id,
      title: r.title ?? r.research_title ?? '',
      abstract: r.abstract ?? r.research_abstract ?? '',
      keywords: Array.isArray(r.keywords)
        ? (r.keywords as BackendKeyword[]).map((k) => k.keyword_name).join(', ')
        : (r.keywords as string) ?? '',
      year: r.year ?? r.published_year ?? 0,
      program: {
        id: r.program?.id ?? 0,
        code: r.program?.code ?? r.program?.name ?? '',
        name: r.program?.name ?? r.program?.code ?? '',
      },
      researchers: Array.isArray(r.researchers)
        ? (r.researchers as BackendPerson[]).map((x) => ({
            id: x.id,
            name: x.name ?? [x.first_name, x.middle_name, x.last_name].filter(Boolean).join(' '),
          }))
        : [],
      adviser: {
        id: r.adviser?.id ?? 0,
        name: r.adviser?.name ?? [r.adviser?.last_name, r.adviser?.first_name].filter(Boolean).join(', '),
      },
      research_approval_sheet: r.research_approval_sheet ?? null,
      research_manuscript: r.research_manuscript ?? null,
      access_count: r.access_count ?? 0,
    }))
    : [];

  type SortOption = 'newest' | 'oldest' | 'accessed' | 'alpha';
  type ViewMode = 'grid' | 'list';
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [openId, setOpenId] = useState<number | null>(null);
  const handleClose = () => setOpenId(null);

  const sortOptions = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'alpha', label: 'Alphabetical' },
    { value: 'accessed', label: 'Most accessed' },
  ];

  const sortedResearches = [...uiResearches].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (b.year ?? 0) - (a.year ?? 0);
      case 'oldest':
        return (a.year ?? 0) - (b.year ?? 0);
      case 'alpha':
        return (a.title ?? '').localeCompare(b.title ?? '');
      case 'accessed':
        return (b.access_count ?? 0) - (a.access_count ?? 0);
      default:
        return 0;
    }
  });

  /**
   * Detect mobile viewport on mount and resize
   */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const onScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /**
   * Listen for Inertia navigation events to show/hide loading state
   */
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleFinish = () => {
      setIsLoading(false);
      setIsMobileFilterOpen(false);
    };

    // Register event listeners
    const removeStartListener = router.on('start', handleStart);
    const removeFinishListener = router.on('finish', handleFinish);

    // Cleanup function returns the unsubscribe functions
    return () => {
      removeStartListener();
      removeFinishListener();
    };
  }, []);

  /**
   * Calculate active filter count for mobile badge
   */
  const activeFilterCount =
    safeFilters.years.length +
    safeFilters.programs.length +
    safeFilters.advisers.length;

  /**
   * Handle filter application
   * Updates URL with new filter parameters using Inertia router
   */
  const handleApplyFilters = (newFilters: Omit<Filters, 'search' | 'page' | 'per_page'>) => {
    const params = new URLSearchParams();

    // Preserve search term
    if (safeFilters.search) {
      params.set('search', safeFilters.search);
    }

    // Add year filters as array params for Laravel
    if (newFilters.years.length > 0) {
      newFilters.years.forEach((y) => params.append('years[]', String(y)));
    }

    // Add program filters as array params for Laravel
    if (newFilters.programs.length > 0) {
      newFilters.programs.forEach((p) => params.append('programs[]', String(p)));
    }

    // Add adviser filters as array params for Laravel
    if (newFilters.advisers.length > 0) {
      newFilters.advisers.forEach((a) => params.append('advisers[]', String(a)));
    }

    // Add per_page
    params.set('per_page', safeFilters.per_page.toString());

    // Reset to first page when filters change
    params.set('page', '1');

    // Navigate with Inertia
    router.get(`/browse?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: false, // Scroll to top when filters change
      replace: false,
    });
  };

  /**
   * Handle reset all filters
   * Clears all filters and returns to default view
   */
  const handleResetFilters = () => {
    const params = new URLSearchParams();

    // Keep only per_page parameter
    params.set('per_page', safeFilters.per_page.toString());

    router.get(`/browse?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: false,
      replace: false,
    });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = activeFilterCount > 0 || !!filters.search;
  const indexedCount = Number((researches as unknown as BackendPaginated<BackendResearch>)?.total ?? uiResearches.length);

  return (
    <>
      <Head title="Browse Research" />
      <AppLayout>
        <div className="space-y-6 p-4 sm:p-6">
          <div className="flex gap-6">
            {/* Filter Sidebar - Desktop */}
            {!isMobile && showFilters && (
              <div className="flex-shrink-0 hidden lg:block w-72">
                <div className="sticky top-6">
                  <FilterSidebar
                    filterOptions={normalizedFilterOptions}
                    currentFilters={{
                      years: safeFilters.years,
                      programs: safeFilters.programs,
                      advisers: safeFilters.advisers,
                    }}
                    onApplyFilters={handleApplyFilters}
                    onResetFilters={handleResetFilters}
                    isMobile={false}
                  />
                </div>
              </div>
            )}

            {/* Filter Sidebar - Mobile (Modal) */}
            {isMobile && (
              <FilterSidebar
                filterOptions={normalizedFilterOptions}
                currentFilters={{
                  years: safeFilters.years,
                  programs: safeFilters.programs,
                  advisers: safeFilters.advisers,
                }}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
                isMobile={true}
                isOpen={isMobileFilterOpen}
                onClose={() => setIsMobileFilterOpen(false)}
              />
            )}

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Page Header Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Browse Research</h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {indexedCount.toLocaleString()} papers indexed
                    </p>
                  </div>
                  {/* Desktop filter toggle */}
                  {!isMobile && (
                    <button
                      type="button"
                      onClick={() => setShowFilters((v) => !v)}
                      className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-blue-500 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Filter className="w-4 h-4" />
                      <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                      {activeFilterCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold px-2 py-0.5">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  )}
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterOpen(true)}
                      className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-blue-500 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <Filter className="w-5 h-5" />
                      <span>Filters</span>
                      {activeFilterCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold px-2 py-0.5">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Search Bar Section */}
              <div className="mb-3">
                <SearchBar
                  initialValue={safeFilters.search}
                  placeholder="Search by keyword, title, or abstract..."
                  onSubmit={(query) => {
                    const params = new URLSearchParams(window.location.search);
                    if (query.trim()) {
                      params.set('search', query.trim());
                    } else {
                      params.delete('search');
                    }
                    params.delete('page');
                    router.get(`/browse?${params.toString()}`, {}, { preserveScroll: false });
                  }}
                  suggestionsEndpoint="/api/search-suggestions"
                  logEndpoint="/api/keyword-search"
                />
              </div>

              {/* Controls Toolbar */}
              <div className="mb-3 flex items-center gap-3">
                {/* Sort Dropdown - matches view toggle height */}
                <SortSelect
                  options={sortOptions}
                  value={sortBy}
                  onChange={(v) => setSortBy(v as SortOption)}
                  className="h-9 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  triggerClassName="h-7 border-none bg-transparent px-0 py-0 text-sm text-gray-900 dark:text-gray-100 focus-visible:ring-0"
                  label="Sort by:"
                />

                {/* View Mode Toggle - hidden on mobile since only 1 column fits */}
                <div className="hidden md:inline-flex items-center h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden" role="tablist" aria-label="View mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'grid'}
                    onClick={() => setViewMode('grid')}
                    className={`h-full px-3 inline-flex items-center justify-center gap-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <div className="w-px h-5 bg-gray-300 dark:bg-gray-700" />
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'list'}
                    onClick={() => setViewMode('list')}
                    className={`h-full px-3 inline-flex items-center justify-center gap-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ListIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>

              {/* Results Count */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Found {indexedCount.toLocaleString()} researches</p>

              {/* Applied filter tags */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {[...safeFilters.years].sort((a, b) => b - a).map((y) => (
                    <button
                      key={`year-${y}`}
                      type="button"
                      onClick={() => handleApplyFilters({
                        years: safeFilters.years.filter((yy) => yy !== y),
                        programs: safeFilters.programs,
                        advisers: safeFilters.advisers,
                      })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs border border-gray-200 dark:border-gray-700"
                      aria-label={`Remove filter year ${y}`}
                    >
                      {y}
                      <span aria-hidden>×</span>
                    </button>
                  ))}
                  {safeFilters.programs.map((pid) => {
                    const p = normalizedFilterOptions.programs.find((pp) => pp.id === pid);
                    const label = p?.name ?? `Program ${pid}`;
                    return (
                      <button
                        key={`program-${pid}`}
                        type="button"
                        onClick={() => handleApplyFilters({
                          years: safeFilters.years,
                          programs: safeFilters.programs.filter((ppid) => ppid !== pid),
                          advisers: safeFilters.advisers,
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs border border-gray-200 dark:border-gray-700"
                        aria-label={`Remove filter ${label}`}
                      >
                        {label}
                        <span aria-hidden>×</span>
                      </button>
                    );
                  })}
                  {safeFilters.advisers.map((aid) => {
                    const a = normalizedFilterOptions.advisers.find((aa) => aa.id === aid);
                    const label = a?.name ?? `Adviser ${aid}`;
                    return (
                      <button
                        key={`adviser-${aid}`}
                        type="button"
                        onClick={() => handleApplyFilters({
                          years: safeFilters.years,
                          programs: safeFilters.programs,
                          advisers: safeFilters.advisers.filter((aaid) => aaid !== aid),
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs border border-gray-200 dark:border-gray-700"
                        aria-label={`Remove filter ${label}`}
                      >
                        {label}
                        <span aria-hidden>×</span>
                      </button>
                    );
                  })}
                  {activeFilterCount > 1 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}

              {/* Active Filters Summary (Mobile) */}
              {isMobile && hasActiveFilters && (
                <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-md">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-blue-900 dark:text-blue-100">
                      <span className="font-semibold">{activeFilterCount}</span> filter
                      {activeFilterCount !== 1 ? 's' : ''} active
                      {safeFilters.search && (
                        <>
                          {' • '}Searching for: <span className="font-semibold">"{safeFilters.search}"</span>
                        </>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 font-medium whitespace-nowrap"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* Research Grid or Empty State */}
              {uiResearches.length === 0 && !isLoading ? (
                <EmptyState
                  variant="no_results"
                  title={hasActiveFilters ? "No Research Found" : "No Research Available Yet"}
                  description={
                    hasActiveFilters
                      ? safeFilters.search
                        ? `No research papers match your search for "${safeFilters.search}" with the current filters applied. Try adjusting your search or filters.`
                        : "No research papers match your current filters. Try adjusting your filter criteria."
                      : "The research repository is currently empty. Check back later or contact the administrator for more information."
                  }
                  actionLabel={hasActiveFilters ? "Clear All Filters" : undefined}
                  onAction={hasActiveFilters ? handleResetFilters : undefined}
                />
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <ResearchGrid
                      researches={sortedResearches}
                      isLoading={isLoading}
                      searchTerm={safeFilters.search}
                    />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <ResearchList researches={sortedResearches} onOpen={setOpenId} />
                      {/* Modal for list view */}
                      <ResearchDetailsModal id={openId} onClose={handleClose} searchTerm={safeFilters.search} />
                    </div>
                  )}

                  {/* Pagination */}
                  {uiResearches.length > 0 && (
                    <Pagination
                      meta={{
                        current_page: Number((researches as unknown as BackendPaginated<BackendResearch>)?.current_page ?? 1),
                        last_page: Number((researches as unknown as BackendPaginated<BackendResearch>)?.last_page ?? 1),
                        per_page: Number((researches as unknown as BackendPaginated<BackendResearch>)?.per_page ?? uiResearches.length),
                        total: Number((researches as unknown as BackendPaginated<BackendResearch>)?.total ?? uiResearches.length),
                        from: Number((researches as unknown as BackendPaginated<BackendResearch>)?.from ?? 0),
                        to: Number((researches as unknown as BackendPaginated<BackendResearch>)?.to ?? uiResearches.length),
                      }}
                      hrefBuilder={(page, perPage) => {
                        const params = new URLSearchParams(window.location.search);
                        params.set('page', page.toString());
                        if (perPage) {
                          params.set('per_page', perPage.toString());
                        }
                        return `/browse?${params.toString()}`;
                      }}
                      perPageOptions={[12, 24, 48, 96]}
                      preserveScroll={false}
                      className="mt-8 sm:mt-10 lg:mt-12"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
