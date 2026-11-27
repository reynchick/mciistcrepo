import FilterSidebar from '@/components/browse/research-filters';
import CardScreenModal from '@/components/librarian/card-screen-modal';
import StatusBadge from '@/components/research/status-badge';
import Pagination from '@/components/shared/pagination';
import SearchBar from '@/components/shared/search-bar';
import ResearchEditModal from '@/components/staff/research-edit-modal';
import ResearchUploadModal from '@/components/staff/research-upload-modal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app/app-layout';
import type { Faculty as FacultyType, SharedData } from '@/types';
import { Head, router, usePage, useRemember } from '@inertiajs/react';
import { ListFilter, Pencil, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

type ResearchRow = {
    id: number;
    research_title: string;
    completed_month?: number | null;
    completed_year?: number | null;
    research_abstract?: string | null;
    status?: string | null;
    can_view_activity?: boolean;
    program?: { name: string; code?: string | null } | null;
    adviser?: { first_name?: string | null; middle_name?: string | null; last_name?: string | null } | null;
    researchers: Researcher[];
    panelists?: Researcher[];
    metadata_values: Metadata[];
    hardbound_location?: string | null;
    physical_availability?: boolean;
    keywords?: Array<{ id: number; keyword_name: string }>;
    agendas?: Array<{ id: number; name: string }>;
    sdgs?: Array<{ id: number; name: string }>;
    srigs?: Array<{ id: number; name: string }>;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
};
type Metadata = { term: string; value: string; scheme?: string | null; sort_order?: number };
type Researcher = { id: number; first_name: string; middle_name?: string | null; last_name: string; is_lead_author?: boolean };
type ManageFilters = { search?: string; status?: string; programs?: number[]; advisers?: number[]; years?: number[] };

const completionDate = (research: ResearchRow) =>
    research.completed_month && research.completed_year
        ? new Date(2000, research.completed_month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
        : research.completed_year
          ? String(research.completed_year)
          : '';
const researcherName = (person: Researcher) => [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' ');
const adviserName = (adviser: ResearchRow['adviser']) =>
    adviser ? [adviser.last_name, adviser.first_name].filter(Boolean).join(', ') : 'Unassigned';

export default function LibrarianResearchIndex({
    researches,
    filters,
    programs,
    faculties,
    keywordOptions,
    agendas,
    sdgs,
    srigs,
    yearOptions,
    metadataTerms,
    editResearchId,
}: {
    researches: Paginated<ResearchRow>;
    filters: ManageFilters;
    programs: Array<{ id: number; name: string; code?: string | null }>;
    faculties: FacultyType[];
    keywordOptions: Array<{ id: number; keyword_name: string }>;
    agendas: Array<{ id: number; name: string }>;
    sdgs: Array<{ id: number; name: string }>;
    srigs: Array<{ id: number; name: string }>;
    yearOptions: number[];
    metadataTerms: string[];
    editResearchId: number | null;
}) {
    const [selectedResearch, setSelectedResearch] = useState<ResearchRow | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [editingResearchId, setEditingResearchId] = useState<number | null>(editResearchId);
    const [showFilters, setShowFilters] = useRemember(false, 'librarian.manageResearch.showFilters');
    const { flash } = usePage<SharedData>().props;

    // Same behavior as Browse Research: the filter drawer closes once the
    // filtered page has finished loading.
    useEffect(() => {
        const removeFinishListener = router.on('finish', () => setShowFilters(false));
        return () => removeFinishListener();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!editingResearchId) return;
        const url = new URL(window.location.href);
        if (!url.searchParams.has('edit')) return;
        url.searchParams.delete('edit');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }, [editingResearchId]);
    const closeResearchEditor = () => {
        setEditingResearchId(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    };
    const buildFilterParams = (next: ManageFilters, page?: number, perPage?: number) => {
        const params = new URLSearchParams();
        if (next.search) params.set('search', next.search);
        if (next.status && next.status !== 'all') params.set('status', next.status);
        next.programs?.forEach((program) => params.append('programs[]', String(program)));
        next.advisers?.forEach((adviser) => params.append('advisers[]', String(adviser)));
        next.years?.forEach((year) => params.append('years[]', String(year)));
        if (page) params.set('page', String(page));
        if (perPage) params.set('per_page', String(perPage));
        return params;
    };
    const navigateWithFilters = (updates: Partial<ManageFilters>) => {
        const next = { ...filters, ...updates };
        const params = buildFilterParams(next);
        const query = params.toString();
        router.get(`/librarian/research${query ? `?${query}` : ''}`, {}, { preserveState: true, preserveScroll: false });
    };
    const activeFilterCount =
        (filters.years?.length ?? 0) +
        (filters.programs?.length ?? 0) +
        (filters.advisers?.length ?? 0) +
        (filters.status && filters.status !== 'all' ? 1 : 0);
    const hasStatusFilter = !!filters.status && filters.status !== 'all';
    const statusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);
    const clearAllFilters = () => navigateWithFilters({ years: [], programs: [], advisers: [], status: 'all' });
    const chipClass =
        'inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200';
    const filterOptions = {
        years: yearOptions.map((year) => ({ year })),
        programs: programs.map(({ id, name, code }) => ({ id, name, code: code ?? undefined })),
        advisers: faculties.map((faculty) => ({
            id: faculty.id,
            name: [faculty.last_name, faculty.first_name].filter(Boolean).join(', '),
        })),
    };

    return (
        <>
            <Head title="Manage Research" />
            <AppLayout>
                {/* Filter drawer (same drawer used by Browse Research) */}
                <FilterSidebar
                    filterOptions={filterOptions}
                    currentFilters={{
                        years: filters.years ?? [],
                        programs: filters.programs ?? [],
                        advisers: filters.advisers ?? [],
                        status: filters.status ?? 'all',
                    }}
                    onApplyFilters={(newFilters) => navigateWithFilters(newFilters)}
                    onResetFilters={clearAllFilters}
                    isMobile
                    isOpen={showFilters}
                    onClose={() => setShowFilters(false)}
                    drawerMode
                    showStatusFilter
                />
                <div className="space-y-6 p-4 sm:p-6">
                    <div>
                        <h1 className="text-xl font-semibold">Manage Research</h1>
                        <p className="text-sm text-muted-foreground">
                            Create or edit complete research records. Librarians can also add Dublin Core catalog metadata and library information.
                        </p>
                    </div>
                    {flash?.success && (
                        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                    )}

                    {/* Search bar (60%) on the left, filter icon + Upload Research pushed to the far right */}
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:w-[60%]">
                            <SearchBar
                                initialValue={filters.search ?? ''}
                                placeholder="Search by title or research ID..."
                                onSubmit={(search) => navigateWithFilters({ search })}
                            />
                        </div>
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <Button
                                type="button"
                                variant="outline"
                                aria-label="Open filters"
                                title="Filters"
                                onClick={() => setShowFilters((value) => !value)}
                                className="relative h-9 bg-white shadow-none dark:bg-slate-900"
                            >
                                <ListFilter className="size-4" />
                                {activeFilterCount > 0 && (
                                    <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                            <Button onClick={() => setShowUpload(true)}>
                                <Upload className="mr-1.5 size-4" />
                                Upload Research
                            </Button>
                        </div>
                    </div>

                    {/* Applied filter tags (same as Browse Research) */}
                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            {[...(filters.years ?? [])]
                                .sort((a, b) => b - a)
                                .map((year) => (
                                    <button
                                        key={`year-${year}`}
                                        type="button"
                                        onClick={() => navigateWithFilters({ years: (filters.years ?? []).filter((y) => y !== year) })}
                                        className={chipClass}
                                        aria-label={`Remove filter year ${year}`}
                                    >
                                        {year}
                                        <span aria-hidden>×</span>
                                    </button>
                                ))}
                            {(filters.programs ?? []).map((programId) => {
                                const label = programs.find((p) => p.id === programId)?.name ?? `Program ${programId}`;
                                return (
                                    <button
                                        key={`program-${programId}`}
                                        type="button"
                                        onClick={() => navigateWithFilters({ programs: (filters.programs ?? []).filter((p) => p !== programId) })}
                                        className={chipClass}
                                        aria-label={`Remove filter ${label}`}
                                    >
                                        {label}
                                        <span aria-hidden>×</span>
                                    </button>
                                );
                            })}
                            {(filters.advisers ?? []).map((adviserId) => {
                                const adviser = faculties.find((f) => f.id === adviserId);
                                const label = adviser
                                    ? [adviser.last_name, adviser.first_name].filter(Boolean).join(', ')
                                    : `Adviser ${adviserId}`;
                                return (
                                    <button
                                        key={`adviser-${adviserId}`}
                                        type="button"
                                        onClick={() => navigateWithFilters({ advisers: (filters.advisers ?? []).filter((a) => a !== adviserId) })}
                                        className={chipClass}
                                        aria-label={`Remove filter ${label}`}
                                    >
                                        {label}
                                        <span aria-hidden>×</span>
                                    </button>
                                );
                            })}
                            {hasStatusFilter && (
                                <button
                                    type="button"
                                    onClick={() => navigateWithFilters({ status: 'all' })}
                                    className={chipClass}
                                    aria-label={`Remove filter status ${filters.status}`}
                                >
                                    {statusLabel(filters.status as string)}
                                    <span aria-hidden>×</span>
                                </button>
                            )}
                            {activeFilterCount > 1 && (
                                <button type="button" onClick={clearAllFilters} className="ml-2 text-xs text-blue-600 hover:text-blue-800">
                                    Clear all
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex items-start gap-6">
                        <div className="min-w-0 flex-1 space-y-4">
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="bg-slate-50 p-3 font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Research ID</th>
                                            <th className="bg-slate-50 p-3 font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Research Title</th>
                                            <th className="bg-slate-50 p-3 font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Program</th>
                                            <th className="bg-slate-50 p-3 font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Adviser</th>
                                            <th className="bg-slate-50 p-3 font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Status</th>
                                            <th className="bg-slate-50 p-3 text-right font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {researches.data.map((research) => (
                                            <tr
                                                className="cursor-pointer border-b border-slate-200 text-slate-900 last:border-0 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/40"
                                                key={research.id}
                                                onClick={() => setSelectedResearch(research)}
                                            >
                                                <td className="p-3 font-medium text-slate-500 dark:text-slate-400">{research.id}</td>
                                                <td className="p-3 font-medium">{research.research_title}</td>
                                                <td className="p-3">{research.program?.name ?? '—'}</td>
                                                <td className="p-3">{adviserName(research.adviser)}</td>
                                                <td className="p-3">
                                                    <StatusBadge status={research.status} />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="border-0 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        aria-label={`${research.status === 'draft' ? 'Edit research entry' : 'Edit research'} for ${research.research_title}`}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setEditingResearchId(research.id);
                                                        }}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {researches.data.length === 0 && (
                                    <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No research records found.</p>
                                )}
                            </div>
                            {researches.total > 0 && (
                                <Pagination
                                    meta={researches}
                                    perPageOptions={[20, 40, 60, 100]}
                                    onChange={(page, perPage) => {
                                        const params = buildFilterParams(filters, page, perPage);
                                        const query = params.toString();
                                        router.get(
                                            `/librarian/research${query ? `?${query}` : ''}`,
                                            {},
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        );
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
            <ResearchUploadModal
                open={showUpload}
                programs={programs}
                faculties={faculties}
                keywordOptions={keywordOptions}
                agendas={agendas}
                sdgs={sdgs}
                srigs={srigs}
                librarianMode
                metadataTerms={metadataTerms}
                onClose={() => setShowUpload(false)}
                onCreated={() => setShowUpload(false)}
            />
            <ResearchEditModal
                researchId={editingResearchId}
                programs={programs}
                faculties={faculties}
                keywordOptions={keywordOptions}
                agendas={agendas}
                sdgs={sdgs}
                srigs={srigs}
                librarianMode
                metadataTerms={metadataTerms}
                onClose={closeResearchEditor}
                onSaved={() => {
                    closeResearchEditor();
                    router.reload({ only: ['researches'] });
                }}
            />
            {selectedResearch && (
                <CardScreenModal
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setSelectedResearch(null);
                    }}
                    fallbackTitle={selectedResearch.research_title}
                    abstract={selectedResearch.research_abstract}
                    metadata={selectedResearch.metadata_values}
                    creatorNames={selectedResearch.researchers.map(researcherName)}
                    hardboundLocation={selectedResearch.hardbound_location}
                    physicalAvailability={selectedResearch.physical_availability}
                    systemInfo={{
                        completionDate: completionDate(selectedResearch),
                        adviser: selectedResearch.adviser
                            ? [selectedResearch.adviser.last_name, selectedResearch.adviser.first_name].filter(Boolean).join(', ')
                            : '',
                        status: selectedResearch.status,
                        program: selectedResearch.program?.name,
                    }}
                    thematicTags={{
                        keywords: selectedResearch.keywords?.map((item) => item.keyword_name),
                        panelists: selectedResearch.panelists?.map((item) => researcherName(item)),
                        agendas: selectedResearch.agendas?.map((item) => item.name),
                        sdgs: selectedResearch.sdgs?.map((item) => item.name),
                        srigs: selectedResearch.srigs?.map((item) => item.name),
                    }}
                    leadCreatorNames={selectedResearch.researchers
                        .filter((person) => person.is_lead_author)
                        .map((person) => [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' '))}
                    onEdit={() => {
                        const researchId = selectedResearch.id;
                        setSelectedResearch(null);
                        setEditingResearchId(researchId);
                    }}
                    activity={{ researchId: selectedResearch.id, canView: Boolean(selectedResearch.can_view_activity) }}
                />
            )}
        </>
    );
}