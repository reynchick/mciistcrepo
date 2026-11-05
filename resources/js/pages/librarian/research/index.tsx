import AppLayout from '@/layouts/app/app-layout';
import ResearchUploadModal from '@/components/staff/research-upload-modal';
import CardScreenModal from '@/components/librarian/card-screen-modal';
import StatusBadge from '@/components/research/status-badge';
import Pagination from '@/components/shared/pagination';
import { Button } from '@/components/ui/button';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Upload } from 'lucide-react';
import type { Faculty as FacultyType, SharedData } from '@/types';
import { useState } from 'react';

type ResearchRow = {
    id: number;
    research_title: string;
    research_abstract?: string | null;
    completed_month?: number | null;
    completed_year?: number | null;
    status?: string | null;
    program?: { name: string; code?: string | null } | null;
    adviser?: { first_name?: string | null; middle_name?: string | null; last_name?: string | null } | null;
    researchers: Researcher[];
    metadata_values: Metadata[];
    physical_attributes?: { hardboundLocation?: string | null; physicalAvailability?: boolean } | null;
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

const completionDate = (research: ResearchRow) => research.completed_month && research.completed_year
    ? new Date(2000, research.completed_month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    : research.completed_year ? String(research.completed_year) : '';
const researcherName = (person: Researcher) => [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' ');
const adviserName = (adviser: ResearchRow['adviser']) => adviser
    ? [adviser.last_name, adviser.first_name].filter(Boolean).join(', ')
    : 'Unassigned';

export default function LibrarianResearchIndex({
    researches,
    filters, programs, faculties, keywordOptions, agendas, sdgs, srigs, metadataTerms,
}: {
    researches: Paginated<ResearchRow>;
    filters: { search?: string };
    programs: Array<{ id: number; name: string; code?: string | null }>;
    faculties: FacultyType[];
    keywordOptions: Array<{ id: number; keyword_name: string }>;
    agendas: Array<{ id: number; name: string }>;
    sdgs: Array<{ id: number; name: string }>;
    srigs: Array<{ id: number; name: string }>;
    metadataTerms: string[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedResearch, setSelectedResearch] = useState<ResearchRow | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const { flash } = usePage<SharedData>().props;
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        router.get('/librarian/research', { search: search || undefined }, { preserveState: true });
    };

    return (
        <>
            <Head title="Manage Research" />
            <AppLayout>
                <div className="space-y-6 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-xl font-semibold">Manage Research</h1>
                            <Button onClick={() => setShowUpload(true)}>
                                <Upload className="mr-1.5 size-4" />
                                Upload Research
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Select a research entry to add or update its Dublin Core metadata and physical library details.</p>
                    </div>
                    {flash?.success && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>}
                    <form onSubmit={submit} className="flex gap-2">
                        <input className="w-full rounded-md border px-3 py-2 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, research ID, or program..." />
                        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">Search</button>
                    </form>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="bg-muted/40 p-3 font-medium text-muted-foreground">Research ID</th>
                                    <th className="bg-muted/40 p-3 font-medium text-muted-foreground">Research Title</th>
                                    <th className="bg-muted/40 p-3 font-medium text-muted-foreground">Program</th>
                                    <th className="bg-muted/40 p-3 font-medium text-muted-foreground">Adviser</th>
                                    <th className="bg-muted/40 p-3 font-medium text-muted-foreground">Status</th>
                                    <th className="bg-muted/40 p-3 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {researches.data.map((research) => (
                                    <tr className="cursor-pointer border-b last:border-0 hover:bg-muted/30" key={research.id} onClick={() => setSelectedResearch(research)}>
                                        <td className="p-3 font-medium text-muted-foreground">{research.id}</td>
                                        <td className="p-3 font-medium">{research.research_title}</td>
                                        <td className="p-3">{research.program?.name ?? '—'}</td>
                                        <td className="p-3">{adviserName(research.adviser)}</td>
                                        <td className="p-3"><StatusBadge status={research.status} /></td>
                                        <td className="p-3 text-right">
                                            <Link
                                                href={`/librarian/research/${research.id}/metadata`}
                                                className="inline-flex items-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                aria-label={`Edit metadata for ${research.research_title}`}
                                                title="Edit metadata"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <Pencil className="size-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {researches.data.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No research records found.</p>}
                    </div>
                    {researches.total > 0 && (
                        <Pagination
                            meta={researches}
                            perPageOptions={[20, 40, 60, 100]}
                            onChange={(page, perPage) => router.get(
                                '/librarian/research',
                                {
                                    search: search || undefined,
                                    page,
                                    per_page: perPage,
                                },
                                { preserveState: true, preserveScroll: true },
                            )}
                        />
                    )}
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
                showMetadata
                metadataTerms={metadataTerms}
                onClose={() => setShowUpload(false)}
                onCreated={() => setShowUpload(false)}
            />
            {selectedResearch && <CardScreenModal
                open={true}
                onOpenChange={(open) => { if (!open) setSelectedResearch(null); }}
                fallbackTitle={selectedResearch.research_title}
                metadata={selectedResearch.metadata_values}
                fallbackMetadata={[
                    { term: 'title', value: selectedResearch.research_title },
                    ...(selectedResearch.research_abstract ? [{ term: 'description', value: selectedResearch.research_abstract }] : []),
                    ...selectedResearch.researchers.map((person, index) => ({ term: 'creator', value: researcherName(person), sort_order: index })),
                    ...(completionDate(selectedResearch) ? [{ term: 'date', value: completionDate(selectedResearch) }] : []),
                    { term: 'identifier', value: String(selectedResearch.id), scheme: 'local research ID' },
                ]}
                physicalAttributes={selectedResearch.physical_attributes}
                systemInfo={{
                    completionDate: completionDate(selectedResearch),
                    adviser: selectedResearch.adviser ? [selectedResearch.adviser.last_name, selectedResearch.adviser.first_name].filter(Boolean).join(', ') : '',
                    status: selectedResearch.status,
                    program: selectedResearch.program?.name,
                }}
                thematicTags={{
                    keywords: selectedResearch.keywords?.map((item) => item.keyword_name),
                    agendas: selectedResearch.agendas?.map((item) => item.name),
                    sdgs: selectedResearch.sdgs?.map((item) => item.name),
                    srigs: selectedResearch.srigs?.map((item) => item.name),
                }}
                leadCreatorNames={selectedResearch.researchers.filter((person) => person.is_lead_author).map((person) => [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' '))}
                editHref={`/librarian/research/${selectedResearch.id}/metadata`}
            />}
        </>
    );
}
