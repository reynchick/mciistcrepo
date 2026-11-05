import AppLayout from '@/layouts/app/app-layout';
import CardScreenModal from '@/components/librarian/card-screen-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Head, router, useForm } from '@inertiajs/react';
import { Eye, Loader2, Plus } from 'lucide-react';
import { Fragment, useState } from 'react';

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
const TERM_ORDER = ['title', 'creator', 'subject', 'description', 'publisher', 'contributor', 'date', 'type', 'format', 'identifier', 'source', 'language', 'relation', 'coverage', 'rights'];
const termOrder = (term: string) => TERM_ORDER.indexOf(term) === -1 ? TERM_ORDER.length : TERM_ORDER.indexOf(term);
const formatDate = (month?: number | null, year?: number | null) => month && year
    ? new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
    : year ? String(year) : '';

export default function EditResearchMetadata({ research, terms }: { research: Research; terms: string[] }) {
    const [showCard, setShowCard] = useState(false);
    const [posting, setPosting] = useState(false);
    const [postError, setPostError] = useState<string | null>(null);
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
    ].sort((a, b) => termOrder(a.term) - termOrder(b.term) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const creatorValues = new Set(research.metadata_values.filter((item) => item.term === 'creator').map((item) => item.value));
    const { data, setData, put, processing, errors } = useForm({
        metadata: initial as Metadata[],
        creator_ids: research.researchers.filter((r) => creatorValues.has(r.full_name ?? [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '))).map((r) => r.id),
        physical_attributes: {
            hardboundLocation: research.physical_attributes?.hardboundLocation ?? '',
            physicalAvailability: research.physical_attributes?.physicalAvailability ?? false,
        },
    });
    const metadataError = 'Unable to save. Please fill in all required fields and try again.';
    const errorFor = (index: number, field: 'value' | 'scheme') => {
        const error = errors[`metadata.${index}.${field}`];
        return Array.isArray(error) ? error[0] : error;
    };
    const hasMetadataError = (index: number, field: 'value' | 'scheme') => Boolean(errorFor(index, field));
    const add = (term: string) => {
        const next = [...data.metadata, { term, value: '', scheme: '', sort_order: data.metadata.filter((m) => m.term === term).length }];
        setData('metadata', next.sort((a, b) => termOrder(a.term) - termOrder(b.term) || (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    };
    const update = (index: number, field: keyof Metadata, value: string) => setData('metadata', data.metadata.map((item, i) => i === index ? { ...item, [field]: field === 'sort_order' ? Number(value) : value } : item));
    const postToRepository = () => {
        setPosting(true);
        setPostError(null);
        put(`/librarian/research/${research.id}/metadata`, {
            preserveScroll: true,
            onSuccess: () => {
                router.post(`/research/${research.id}/post`, {}, {
                    preserveScroll: true,
                    onError: () => setPostError('Unable to post. Please complete all required fields and try again.'),
                    onFinish: () => setPosting(false),
                });
            },
            onError: () => setPosting(false),
        });
    };

    return (
        <>
            <Head title={`Metadata: ${research.research_title}`} />
            <AppLayout>
                <form className="space-y-6 p-4 sm:p-6" onSubmit={(event) => { event.preventDefault(); put(`/librarian/research/${research.id}/metadata`); }}>
                    <div><h1 className="text-xl font-semibold">{research.research_title}</h1></div>
                    {(Object.keys(errors).length > 0 || postError) && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                            {postError ?? metadataError}
                        </div>
                    )}
                    <section className="space-y-4 border-b pb-5">
                        <div className="flex items-center justify-between"><h2 className="font-semibold">Dublin Core metadata</h2><select className="rounded-md border px-2 py-1 text-sm" defaultValue="" onChange={(e) => { if (e.target.value) add(e.target.value); e.currentTarget.value = ''; }}><option value="">Add term…</option>{terms.map((term) => <option key={term} value={term}>{label(term)}</option>)}</select></div>
                        {data.metadata.map((item, index) => {
                            if (item.term === 'creator' && index > 0 && data.metadata[index - 1].term === 'creator') return null;
                            if (item.term === 'creator') {
                                const creatorItems = data.metadata
                                    .map((creator, creatorIndex) => ({ creator, creatorIndex }))
                                    .filter(({ creator }) => creator.term === 'creator');
                                return (
                                    <div className="grid items-start gap-3 border-b py-3 last:border-b-0 md:grid-cols-[10rem_670px_auto]" key="creator-group">
                                        <div className="pt-2 text-sm font-medium">Creator</div>
                                        <div className="group/creator rounded-md border p-3">
                                            {creatorItems.map(({ creator, creatorIndex }, creatorPosition) => (
                                                <Fragment key={`creator-${creatorIndex}`}>
                                                    {creatorPosition > 0 && <div className="my-3 border-t" />}
                                                    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_auto]">
                                                        <input className={`w-full rounded-md border px-2 py-1.5 text-sm ${hasMetadataError(creatorIndex, 'value') ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={creator.value} onChange={(e) => update(creatorIndex, 'value', e.target.value)} placeholder="Creator" />
                                                        <input className={`w-full rounded-md border px-2 py-1.5 text-xs text-muted-foreground ${hasMetadataError(creatorIndex, 'scheme') ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={creator.scheme ?? ''} onChange={(e) => update(creatorIndex, 'scheme', e.target.value)} placeholder="Scheme (optional)" />
                                                        <button className="pt-2 text-sm text-destructive" type="button" onClick={() => setData('metadata', data.metadata.filter((_, i) => i !== creatorIndex))}>Remove</button>
                                                    </div>
                                                </Fragment>
                                            ))}
                                            <button className="mx-auto mt-3 flex items-center gap-1 rounded-full border px-3 py-1 text-sm text-primary opacity-0 transition-opacity group-hover/creator:opacity-100" type="button" onClick={() => add('creator')}>
                                                <Plus className="size-4" />
                                                Add creator
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <div className="grid items-start gap-3 border-b py-3 last:border-b-0 md:grid-cols-[10rem_1fr_auto]" key={`${item.term}-${index}`}>
                                    <div className="pt-2 text-sm font-medium">{label(item.term)}</div>
                                    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)]">
                                        {item.term === 'description' ? (
                                            <Textarea className={`min-h-16 resize-y text-sm ${hasMetadataError(index, 'value') ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={item.value} onChange={(e) => update(index, 'value', e.target.value)} placeholder="Value" rows={3} />
                                        ) : (
                                            <input className={`w-full rounded-md border px-2 py-1.5 text-sm ${hasMetadataError(index, 'value') ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={item.value} onChange={(e) => update(index, 'value', e.target.value)} placeholder="Value" />
                                        )}
                                        <input className={`w-full rounded-md border px-2 py-1 text-xs text-muted-foreground ${hasMetadataError(index, 'scheme') ? 'border-red-500 ring-1 ring-red-500' : ''}`} value={item.scheme ?? ''} onChange={(e) => update(index, 'scheme', e.target.value)} placeholder="Scheme (optional)" />
                                    </div>
                                    <button className="pt-2 text-sm text-destructive" type="button" onClick={() => setData('metadata', data.metadata.filter((_, i) => i !== index))}>Remove</button>
                                </div>
                            );
                        })}
                        {data.metadata.length === 0 && <p className="text-sm text-muted-foreground">No metadata values yet. Add a term above.</p>}
                        {errors.metadata && <p className="text-sm text-destructive">{errors.metadata}</p>}
                    </section>
                    <section className="space-y-3 pb-2"><h2 className="font-semibold">Library information</h2><input className="w-full rounded-md border px-2 py-1.5 text-sm" value={data.physical_attributes.hardboundLocation} onChange={(e) => setData('physical_attributes', { ...data.physical_attributes, hardboundLocation: e.target.value })} placeholder="Hardbound location" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.physical_attributes.physicalAvailability} onChange={(e) => setData('physical_attributes', { ...data.physical_attributes, physicalAvailability: e.target.checked })} />Available in physical library</label></section>
                    <div className="flex items-center justify-between gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowCard(true)}>
                            <Eye className="mr-2 size-4" />
                            View card screen
                        </Button>
                        <div className="flex gap-2">
                            <Button type="submit" variant="outline" disabled={processing || posting}>
                                {processing && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Save
                            </Button>
                            {research.status !== 'posted' && (
                                <Button type="button" disabled={processing || posting} onClick={postToRepository}>
                                    {posting && <Loader2 className="mr-2 size-4 animate-spin" />}
                                    Post to Repository
                                </Button>
                            )}
                        </div>
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
