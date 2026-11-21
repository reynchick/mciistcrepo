import FilterSidebar from '@/components/browse/research-filters';
import ArchiveModal from '@/components/modals/archive-modal';
import ConfirmationModal from '@/components/modals/confirmation-modal';
import ResearchCardScreenModal from '@/components/research/research-card-screen-modal';
import StatusBadge from '@/components/research/status-badge';
import EmptyState from '@/components/shared/empty-state';
import FilterToggleButton from '@/components/shared/filter-toggle-button';
import Pagination from '@/components/shared/pagination';
import SearchBar from '@/components/shared/search-bar';
import ResearchEditModal from '@/components/staff/research-edit-modal';
import ResearchUploadModal from '@/components/staff/research-upload-modal';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app/app-layout';
import type { Faculty as FacultyType } from '@/types';
import { Head, router, useRemember } from '@inertiajs/react';
import { Archive, CheckCircle2, Pencil, RotateCcw, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Program {
    id: number;
    name: string;
    code?: string | null;
}

interface KeywordOption {
    id: number;
    keyword_name: string;
}

interface ThematicOption {
    id: number;
    name: string;
}

interface AdviserRef {
    id: number;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
}

interface ResearchRow {
    id: number;
    research_title: string;
    program: Program | null;
    adviser: AdviserRef | null;
    status?: string | null;
    completed_year?: number | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    researches: PaginatedData<ResearchRow>;
    filters: { search?: string; status?: string; programs?: number[]; advisers?: number[]; years?: number[] };
    programs: Program[];
    faculties: FacultyType[];
    yearOptions: number[];
    keywordOptions: KeywordOption[];
    agendas: ThematicOption[];
    sdgs: ThematicOption[];
    srigs: ThematicOption[];
}

export default function ManageResearch({ researches, filters, programs, faculties, yearOptions, keywordOptions, agendas, sdgs, srigs }: Props) {
    const [openDetailsId, setOpenDetailsId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [archivingResearch, setArchivingResearch] = useState<ResearchRow | null>(null);
    const [archiving, setArchiving] = useState(false);
    const [restoringResearch, setRestoringResearch] = useState<ResearchRow | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useRemember(false, 'staff.manageResearch.showFilters');
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), 4000);
        return () => clearTimeout(t);
    }, [banner]);

    const navigateWithFilters = (updates: Partial<Props['filters']>) => {
        const next = { ...filters, ...updates };
        const params = new URLSearchParams();
        if (next.search) params.set('search', next.search);
        if (next.status && next.status !== 'all') params.set('status', next.status);
        next.programs?.forEach((program) => params.append('programs[]', String(program)));
        next.advisers?.forEach((adviser) => params.append('advisers[]', String(adviser)));
        next.years?.forEach((year) => params.append('years[]', String(year)));
        const query = params.toString();
        router.get(`/staff/research${query ? `?${query}` : ''}`, {}, { preserveState: true, preserveScroll: false });
    };

    const handleSaved = (title: string) => {
        setEditingId(null);
        setBanner(`"${title}" was updated successfully.`);
    };

    const handleCreated = (title: string) => {
        setShowUpload(false);
        setBanner(`"${title}" was uploaded successfully.`);
    };

    const archiveResearch = (reason?: string) => {
        if (!archivingResearch) return;

        setArchiving(true);
        router.post(
            `/research/${archivingResearch.id}/archive`,
            { reason: reason?.trim() ?? '' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBanner(`"${archivingResearch.research_title}" was archived.`);
                    setArchivingResearch(null);
                },
                onFinish: () => setArchiving(false),
            },
        );
    };

    const restoreResearch = () => {
        if (!restoringResearch) return;

        setRestoring(true);
        router.post(
            `/research/${restoringResearch.id}/restore`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBanner(`"${restoringResearch.research_title}" was restored.`);
                    setRestoringResearch(null);
                },
                onFinish: () => setRestoring(false),
            },
        );
    };

    const adviserName = (a: AdviserRef | null) => (a ? [a.last_name, a.first_name].filter(Boolean).join(', ') : 'Unassigned');
    const activeFilterCount =
        (filters.years?.length ?? 0) +
        (filters.programs?.length ?? 0) +
        (filters.advisers?.length ?? 0) +
        (filters.status && filters.status !== 'all' ? 1 : 0);
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
                <div className="space-y-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">Manage Research</h2>
                            <p className="mt-0.5 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
                                {researches.total.toLocaleString()} research record(s)
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <FilterToggleButton
                                isOpen={isMobile ? isMobileFilterOpen : showFilters}
                                activeFilterCount={activeFilterCount}
                                onClick={() => (isMobile ? setIsMobileFilterOpen(true) : setShowFilters((value) => !value))}
                                className={isMobile ? 'lg:hidden' : 'hidden lg:inline-flex'}
                            />
                            <Button onClick={() => setShowUpload(true)}>
                                <Upload className="mr-1.5 size-4" />
                                Upload Research
                            </Button>
                        </div>
                    </div>

                    {banner && (
                        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-300">
                            <CheckCircle2 className="size-4 shrink-0" />
                            <span className="flex-1">{banner}</span>
                            <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss">
                                <X className="size-4" />
                            </button>
                        </div>
                    )}

                    <div className="mb-3">
                        <SearchBar
                            initialValue={filters.search ?? ''}
                            placeholder="Search by title, research ID, or program..."
                            onSubmit={(search) => navigateWithFilters({ search })}
                        />
                    </div>

                    <div className="flex items-start gap-6">
                        {!isMobile && showFilters && (
                            <div className="hidden flex-shrink-0 lg:block">
                                <FilterSidebar
                                    filterOptions={filterOptions}
                                    currentFilters={{
                                        years: filters.years ?? [],
                                        programs: filters.programs ?? [],
                                        advisers: filters.advisers ?? [],
                                        status: filters.status ?? 'all',
                                    }}
                                    onApplyFilters={(newFilters) => navigateWithFilters(newFilters)}
                                    onResetFilters={() => navigateWithFilters({ years: [], programs: [], advisers: [], status: 'all' })}
                                    isMobile={false}
                                    showStatusFilter
                                />
                            </div>
                        )}
                        <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            {researches.data.length === 0 ? (
                                <EmptyState
                                    variant="no_results"
                                    title={filters.search ? 'No Research Found' : 'No Research Available Yet'}
                                    description={
                                        filters.search
                                            ? `No research records match your search for "${filters.search}".`
                                            : 'There are no research records in the repository yet.'
                                    }
                                    actionLabel={filters.search ? 'Clear Search' : undefined}
                                    onAction={filters.search ? () => navigateWithFilters({ search: '' }) : undefined}
                                />
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Research ID</TableHead>
                                                <TableHead>Research Title</TableHead>
                                                <TableHead>Program</TableHead>
                                                <TableHead>Adviser</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {researches.data.map((r) => (
                                                <TableRow key={r.id} onClick={() => setOpenDetailsId(r.id)} className="cursor-pointer">
                                                    <TableCell className="font-medium text-muted-foreground">{r.id}</TableCell>
                                                    <TableCell className="font-medium">{r.research_title}</TableCell>
                                                    <TableCell>{r.program?.name ?? '-'}</TableCell>
                                                    <TableCell>{adviserName(r.adviser)}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={r.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {r.status === 'archived' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setRestoringResearch(r);
                                                                }}
                                                            >
                                                                <RotateCcw className="mr-1.5 size-3.5" />
                                                                Restore
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingId(r.id);
                                                                    }}
                                                                >
                                                                    <Pencil className="mr-1.5 size-3.5" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="ml-2 text-destructive hover:text-destructive"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setArchivingResearch(r);
                                                                    }}
                                                                >
                                                                    <Archive className="mr-1.5 size-3.5" />
                                                                    Archive
                                                                </Button>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    <Pagination
                                        meta={{
                                            current_page: researches.current_page,
                                            last_page: researches.last_page,
                                            per_page: researches.per_page,
                                            total: researches.total,
                                            from: researches.from,
                                            to: researches.to,
                                        }}
                                        hrefBuilder={(page, perPage) => {
                                            const params = new URLSearchParams(window.location.search);
                                            params.set('page', page.toString());
                                            if (perPage) params.set('per_page', perPage.toString());
                                            return `/staff/research?${params.toString()}`;
                                        }}
                                        className="mt-6"
                                    />
                                </>
                            )}
                        </div>
                        {isMobile && (
                            <FilterSidebar
                                filterOptions={filterOptions}
                                currentFilters={{
                                    years: filters.years ?? [],
                                    programs: filters.programs ?? [],
                                    advisers: filters.advisers ?? [],
                                    status: filters.status ?? 'all',
                                }}
                                onApplyFilters={(newFilters) => navigateWithFilters(newFilters)}
                                onResetFilters={() => navigateWithFilters({ years: [], programs: [], advisers: [], status: 'all' })}
                                isMobile
                                isOpen={isMobileFilterOpen}
                                onClose={() => setIsMobileFilterOpen(false)}
                                showStatusFilter
                            />
                        )}
                    </div>
                </div>

                <ResearchCardScreenModal id={openDetailsId} onClose={() => setOpenDetailsId(null)} />

                <ResearchEditModal
                    researchId={editingId}
                    programs={programs}
                    faculties={faculties}
                    keywordOptions={keywordOptions}
                    agendas={agendas}
                    sdgs={sdgs}
                    srigs={srigs}
                    onClose={() => setEditingId(null)}
                    onSaved={handleSaved}
                    staffMode
                />

                <ResearchUploadModal
                    open={showUpload}
                    programs={programs}
                    faculties={faculties}
                    keywordOptions={keywordOptions}
                    agendas={agendas}
                    sdgs={sdgs}
                    srigs={srigs}
                    onClose={() => setShowUpload(false)}
                    onCreated={handleCreated}
                />

                <ArchiveModal
                    open={archivingResearch !== null}
                    onOpenChange={(open) => {
                        if (!open && !archiving) setArchivingResearch(null);
                    }}
                    title={archivingResearch?.research_title ?? ''}
                    program={archivingResearch?.program?.name}
                    year={archivingResearch?.completed_year ?? undefined}
                    onArchive={archiveResearch}
                    isLoading={archiving}
                />

                <ConfirmationModal
                    open={restoringResearch !== null}
                    onOpenChange={(open) => {
                        if (!open && !restoring) setRestoringResearch(null);
                    }}
                    title="Restore research"
                    description={`Restore “${restoringResearch?.research_title ?? ''}” to its status before it was archived?`}
                    confirmText="Restore"
                    cancelText="Cancel"
                    icon={RotateCcw}
                    onConfirm={restoreResearch}
                    isLoading={restoring}
                />
            </AppLayout>
        </>
    );
}
