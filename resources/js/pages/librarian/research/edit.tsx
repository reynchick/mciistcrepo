import AppLayout from '@/layouts/app/app-layout';
import CardScreenModal from '@/components/librarian/card-screen-modal';
import { Button } from '@/components/ui/button';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

type Metadata = { id?: number; term: string; value: string; scheme?: string | null; sort_order?: number };
type Researcher = { id: number; full_name?: string; first_name: string; middle_name?: string | null; last_name: string; is_lead_author?: boolean };
type Research = {
    id: number;
    research_title: string;
    completed_month?: number | null;
    completed_year?: number | null;
    status?: string | null;
    research_abstract?: string | null;
    program?: { name: string; code?: string | null } | null;
    adviser?: { first_name?: string; last_name?: string } | null;
    researchers: Researcher[];
    metadata_values: Metadata[];
    physical_attributes?: { hardboundLocation?: string | null; physicalAvailability?: boolean } | null;
    keywords?: Array<{ id: number; keyword_name: string }>;
    agendas?: Array<{ id: number; name: string }>;
    sdgs?: Array<{ id: number; name: string }>;
    srigs?: Array<{ id: number; name: string }>;
};

const label = (term: string) => term.charAt(0).toUpperCase() + term.slice(1);
const formatDate = (month?: number | null, year?: number | null) => month && year
    ? new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    : year ? String(year) : '';

export default function EditResearchMetadata({ research, terms }: { research: Research; terms: string[] }) {
    const [showCard, setShowCard] = useState(false);
    const existing = new Set(research.metadata_values.map((item) => item.term));
    const initial = [
        ...research.metadata_values.map(({ term, value, scheme, sort_order }) => ({ term, value, scheme: scheme ?? '', sort_order: sort_order ?? 0 })),
        ...(!existing.has('title') ? [{ term: 'title', value: research.research_title, scheme: '', sort_order: 0 }] : []),
        ...(!existing.has('description') && research.research_abstract ? [{ term: 'description', value: research.research_abstract, scheme: '', sort_order: 0 }] : []),
        ...(!existing.has('date') && formatDate(research.completed_month, research.completed_year) ? [{ term: 'date', value: formatDate(research.completed_month, research.completed_year), scheme: '', sort_order: 0 }] : []),
        ...(!existing.has('identifier') ? [{ term: 'identifier', value: String(research.id), scheme: 'local research ID', sort_order: 0 }] : []),
        ...research.researchers
            .filter((person) => {
                const name = person.full_name ?? [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' ');
                return !research.metadata_values.some((item) => item.term === 'creator' && item.value === name);
            })
            .map((person, index) => ({
                term: 'creator',
                value: person.full_name ?? [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' '),
                scheme: '',
                sort_order: index,
            })),
    ];
    const creatorValues = new Set(research.metadata_values.filter((item) => item.term === 'creator').map((item) => item.value));
    const { data, setData, put, processing, errors } = useForm({
        metadata: initial as Metadata[],
        creator_ids: research.researchers.filter((r) => creatorValues.has(r.full_name ?? [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '))).map((r) => r.id),
        physical_attributes: {
            hardboundLocation: research.physical_attributes?.hardboundLocation ?? '',
            physicalAvailability: research.physical_attributes?.physicalAvailability ?? false,
        },
    });
    const add = (term: string) => setData('metadata', [...data.metadata, { term, value: '', scheme: '', sort_order: data.metadata.filter((m) => m.term === term).length }]);
    const update = (index: number, field: keyof Metadata, value: string) => setData('metadata', data.metadata.map((item, i) => i === index ? { ...item, [field]: field === 'sort_order' ? Number(value) : value } : item));

    return (
        <>
            <Head title={`Metadata: ${research.research_title}`} />
            <AppLayout>
                <form className="space-y-6 p-4 sm:p-6" onSubmit={(event) => { event.preventDefault(); put(`/librarian/research/${research.id}/metadata`); }}>
                    <div><h1 className="text-xl font-semibold">{research.research_title}</h1></div>
                    <section className="space-y-4 border-b pb-5">
                        <div className="flex items-center justify-between"><h2 className="font-semibold">Dublin Core metadata</h2><select className="rounded-md border px-2 py-1 text-sm" defaultValue="" onChange={(e) => { if (e.target.value) add(e.target.value); e.currentTarget.value = ''; }}><option value="">Add term…</option>{terms.map((term) => <option key={term} value={term}>{label(term)}</option>)}</select></div>
                        {data.metadata.map((item, index) => <div className="grid items-center gap-3 border-b py-3 last:border-b-0 md:grid-cols-[10rem_1fr_auto]" key={`${item.term}-${index}`}><div className="text-sm font-medium">{label(item.term)}</div><div className="space-y-1"><input className="w-full rounded-md border px-2 py-1.5 text-sm" value={item.value} onChange={(e) => update(index, 'value', e.target.value)} placeholder="Value" /><input className="w-full rounded-md border px-2 py-1 text-xs text-muted-foreground" value={item.scheme ?? ''} onChange={(e) => update(index, 'scheme', e.target.value)} placeholder="Scheme (optional)" /></div><button className="text-sm text-destructive" type="button" onClick={() => setData('metadata', data.metadata.filter((_, i) => i !== index))}>Remove</button></div>)}
                        {data.metadata.length === 0 && <p className="text-sm text-muted-foreground">No metadata values yet. Add a term above.</p>}
                        {errors.metadata && <p className="text-sm text-destructive">{errors.metadata}</p>}
                    </section>
                    <section className="space-y-3 pb-2"><h2 className="font-semibold">Library information</h2><input className="w-full rounded-md border px-2 py-1.5 text-sm" value={data.physical_attributes.hardboundLocation} onChange={(e) => setData('physical_attributes', { ...data.physical_attributes, hardboundLocation: e.target.value })} placeholder="Hardbound location" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.physical_attributes.physicalAvailability} onChange={(e) => setData('physical_attributes', { ...data.physical_attributes, physicalAvailability: e.target.checked })} />Available in physical library</label></section>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowCard(true)}>View card screen</Button>
                        <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={processing} type="submit">Save metadata</button>
                    </div>
                </form>
            </AppLayout>
            <CardScreenModal
                open={showCard}
                onOpenChange={setShowCard}
                fallbackTitle={research.research_title}
                metadata={[
                    ...data.metadata,
                    ...research.researchers
                        .filter((person) => data.creator_ids.includes(person.id))
                        .filter((person) => !data.metadata.some((item) => item.term === 'creator' && item.value === (person.full_name ?? [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' '))))
                        .map((person) => ({ term: 'creator', value: person.full_name ?? [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' ') })),
                ]}
                physicalAttributes={data.physical_attributes}
                systemInfo={{
                    completionDate: formatDate(research.completed_month, research.completed_year),
                    adviser: research.adviser ? [research.adviser.last_name, research.adviser.first_name].filter(Boolean).join(', ') : '',
                    status: research.status,
                    program: research.program?.name,
                }}
                thematicTags={{
                    keywords: research.keywords?.map((item) => item.keyword_name),
                    agendas: research.agendas?.map((item) => item.name),
                    sdgs: research.sdgs?.map((item) => item.name),
                    srigs: research.srigs?.map((item) => item.name),
                }}
                leadCreatorNames={research.researchers.filter((person) => person.is_lead_author).map((person) => person.full_name ?? [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' '))}
            />
        </>
    );
}
