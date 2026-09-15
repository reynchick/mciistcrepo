import ResearchDetailsModal from '@/components/browse/research-details-modal';
import ResearchUploadModal from '@/components/faculty/research-upload-modal';
import StatusBadge from '@/components/research/status-badge';
import EmptyState from '@/components/shared/empty-state';
import Pagination from '@/components/shared/pagination';
import SearchBar from '@/components/shared/search-bar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app/app-layout';
import type { Faculty as FacultyType } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Eye, Pencil, Upload, X } from 'lucide-react';
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
    staff_originated?: boolean;
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

interface CurrentFaculty {
    id: number;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
}

interface Props {
    researches: PaginatedData<ResearchRow>;
    filters: { search?: string };
    currentFaculty: CurrentFaculty;
    programs: Program[];
    faculties: FacultyType[];
    keywordOptions: KeywordOption[];
    agendas: ThematicOption[];
    sdgs: ThematicOption[];
    srigs: ThematicOption[];
}

export default function MyResearches({
    researches,
    filters,
    currentFaculty,
    programs,
    faculties,
    keywordOptions,
    agendas,
    sdgs,
    srigs,
}: Props) {
    const [openDetailsId, setOpenDetailsId] = useState<number | null>(null);
    const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [banner, setBanner] = useState<string | null>(null);

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), 4000);
        return () => clearTimeout(t);
    }, [banner]);

    const handleSearch = (query: string) => {
        router.get('/faculty/my-researches', query ? { search: query } : {}, { preserveState: true, preserveScroll: false });
    };

    const handleSaved = (title: string) => {
        setEditingDraftId(null);
        setBanner(`"${title}" was updated successfully.`);
        router.reload({ only: ['researches'], preserveScroll: true });
    };

    const handleCreated = (title: string) => {
        setShowUpload(false);
        setBanner(`"${title}" was uploaded successfully.`);
        router.reload({ only: ['researches'], preserveScroll: true });
    };

    const adviserName = (a: AdviserRef | null) => (a ? [a.last_name, a.first_name].filter(Boolean).join(', ') : 'Unassigned');

    return (
        <>
            <Head title="My Researches" />
            <AppLayout>
                <div className="space-y-6 p-4 sm:p-6">
                    <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">My Researches</h2>
                            <p className="mt-0.5 text-xs text-gray-600 sm:text-sm dark:text-gray-400">
                                {researches.total.toLocaleString()} research record(s)
                            </p>
                        </div>
                        <Button onClick={() => setShowUpload(true)}>
                            <Upload className="mr-1.5 size-4" />
                            Upload Research
                        </Button>
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
                            onSubmit={handleSearch}
                        />
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        {researches.data.length === 0 ? (
                            <EmptyState
                                variant="no_results"
                                title={filters.search ? 'No Research Found' : 'No Research Available Yet'}
                                description={
                                    filters.search
                                        ? `No research records match your search for "${filters.search}".`
                                        : "You haven't uploaded any research yet."
                                }
                                actionLabel={filters.search ? 'Clear Search' : undefined}
                                onAction={filters.search ? () => handleSearch('') : undefined}
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
                                        {researches.data.map((r) => {
                                            const status = String(r.status ?? 'draft');
                                            const viewOnlyStatus = ['submitted', 'returned', 'posted'].includes(status);
                                            const actionLabel =
                                                status === 'submitted'
                                                    ? 'Review Submission'
                                                    : status === 'returned'
                                                      ? 'View'
                                                      : status === 'posted'
                                                        ? 'View'
                                                        : 'Edit Draft';

                                            return (
                                                <TableRow key={r.id} onClick={() => setOpenDetailsId(r.id)} className="cursor-pointer">
                                                    <TableCell className="font-medium text-muted-foreground">{r.id}</TableCell>
                                                    <TableCell className="font-medium">{r.research_title}</TableCell>
                                                    <TableCell>{r.program?.name ?? '-'}</TableCell>
                                                    <TableCell>{adviserName(r.adviser)}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={r.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (viewOnlyStatus) {
                                                                    router.visit(`/research/${r.id}`);
                                                                    return;
                                                                }
                                                                setEditingDraftId(r.id);
                                                            }}
                                                        >
                                                            {viewOnlyStatus ? (
                                                                <Eye className="mr-1.5 size-3.5" />
                                                            ) : (
                                                                <Pencil className="mr-1.5 size-3.5" />
                                                            )}
                                                            {actionLabel}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
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
                                        return `/faculty/my-researches?${params.toString()}`;
                                    }}
                                    className="mt-6"
                                />
                            </>
                        )}
                    </div>

                </div>

                <ResearchDetailsModal id={openDetailsId} onClose={() => setOpenDetailsId(null)} />

                <ResearchUploadModal
                    open={showUpload || editingDraftId !== null}
                    researchId={editingDraftId}
                    hideInviteResearchers={Boolean(researches.data.find((research) => research.id === editingDraftId)?.staff_originated)}
                    programs={programs}
                    faculties={faculties}
                    keywordOptions={keywordOptions}
                    agendas={agendas}
                    sdgs={sdgs}
                    srigs={srigs}
                    currentFaculty={currentFaculty}
                    onClose={() => {
                        setShowUpload(false);
                        setEditingDraftId(null);
                    }}
                    onCreated={editingDraftId !== null ? handleSaved : handleCreated}
                />
            </AppLayout>
        </>
    );
}
