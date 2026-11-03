import AppLayout from '@/layouts/app/app-layout';
import CardScreenModal from '@/components/librarian/card-screen-modal';
import Pagination from '@/components/shared/pagination';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
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

export default function LibrarianResearchIndex({
    researches,
    filters,
}: {
    researches: Paginated<ResearchRow>;
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedResearch, setSelectedResearch] = useState<ResearchRow | null>(null);
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
                        <h1 className="text-xl font-semibold">Manage Research</h1>
                        <p className="text-sm text-muted-foreground">Select a research entry to add or update its Dublin Core metadata and physical library details.</p>
                    </div>
                    {flash?.success && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>}
                    <form onSubmit={submit} className="flex gap-2">
                        <input className="w-full rounded-md border px-3 py-2 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or research ID" />
                        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" type="submit">Search</button>
                    </form>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-left text-sm">
                            <thead><tr className="border-b bg-muted/40"><th className="p-3">Title</th><th className="p-3">Program</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
                            <tbody>
                                {researches.data.map((research) => (
                                    <tr className="cursor-pointer border-b last:border-0 hover:bg-muted/30" key={research.id} onClick={() => setSelectedResearch(research)}>
                                        <td className="p-3 font-medium">{research.research_title}</td>
                                        <td className="p-3">{research.program?.code ?? research.program?.name ?? '—'}</td>
                                        <td className="p-3 capitalize">{research.status ?? '—'}</td>
                                        <td className="p-3 text-right"><button type="button" className="text-primary underline" onClick={(event) => { event.stopPropagation(); setSelectedResearch(research); }}>View card</button></td>
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
