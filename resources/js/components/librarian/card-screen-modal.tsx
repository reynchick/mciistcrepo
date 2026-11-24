import ResearchActivityDisclosure from '@/components/research/research-activity-disclosure';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

type Metadata = { term: string; value: string; scheme?: string | null; sort_order?: number };

const labels: Record<string, string> = {
    title: 'Title',
    creator: 'Creator',
    subject: 'Subject',
    description: 'Description',
    publisher: 'Publisher',
    contributor: 'Contributor',
    date: 'Date',
    type: 'Type',
    format: 'Format',
    identifier: 'Identifier',
    source: 'Source',
    language: 'Language',
    relation: 'Relation',
    coverage: 'Coverage',
    rights: 'Rights',
};

const dublinCoreOrder = [
    'title',
    'creator',
    'subject',
    'description',
    'publisher',
    'contributor',
    'date',
    'type',
    'format',
    'identifier',
    'source',
    'language',
    'relation',
    'coverage',
    'rights',
];

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fallbackTitle: string;
    metadata: Metadata[];
    fallbackMetadata?: Metadata[];
    abstract?: string | null;
    creatorNames?: string[];
    editHref?: string;
    onEdit?: () => void;
    hardboundLocation?: string | null;
    physicalAvailability?: boolean;
    systemInfo?: {
        completionDate?: string;
        adviser?: string;
        status?: string | null;
        program?: string;
    };
    thematicTags?: {
        keywords?: string[];
        panelists?: string[];
        agendas?: string[];
        sdgs?: string[];
        srigs?: string[];
    };
    leadCreatorNames?: string[];
    extraContent?: ReactNode;
    activity?: { researchId: number; canView: boolean };
    loading?: boolean;
    error?: string | null;
    searchTerm?: string;
};

export default function CardScreenModal({
    open,
    onOpenChange,
    fallbackTitle,
    metadata,
    fallbackMetadata = [],
    abstract,
    creatorNames,
    editHref,
    onEdit,
    hardboundLocation,
    physicalAvailability,
    systemInfo,
    thematicTags,
    leadCreatorNames = [],
    extraContent,
    activity,
    loading = false,
    error,
    searchTerm,
}: Props) {
    const metadataTerms = new Set(metadata.map((item) => item.term));
    const metadataCreators = metadata.filter((item) => item.term === 'creator');
    const fallbackCreators = fallbackMetadata.filter((item) => item.term === 'creator');
    const combinedMetadata = [
        ...metadata,
        ...fallbackMetadata.filter((item) => item.term !== 'creator' && !metadataTerms.has(item.term)),
        ...(metadataCreators.length === 0 ? fallbackCreators : []),
    ];
    const sortedValues = [...combinedMetadata].sort((a, b) => {
        const aOrder = dublinCoreOrder.indexOf(a.term);
        const bOrder = dublinCoreOrder.indexOf(b.term);
        return (
            (aOrder < 0 ? dublinCoreOrder.length : aOrder) - (bOrder < 0 ? dublinCoreOrder.length : bOrder) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
    });
    const storedCreatorValues = sortedValues
        .filter((item) => item.term === 'creator')
        .filter(
            (item, index, values) =>
                values.findIndex((candidate) => candidate.value.trim().toLowerCase() === item.value.trim().toLowerCase()) === index,
        );
    const creators = creatorNames ?? storedCreatorValues.map((item) => item.value);
    const values = sortedValues.filter(
        (item) =>
            !['title', 'creator', 'date'].includes(item.term) &&
            !(item.term === 'description' && item.value.trim() === abstract?.trim()) &&
            !(item.term === 'identifier' && item.scheme?.trim().toLowerCase() === 'local research id'),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl lg:max-w-5xl">
                <div className="bg-slate-800 px-6 py-5 text-white">
                    <h2 className="text-xl font-semibold">{fallbackTitle || 'Research details'}</h2>
                    {creators.length > 0 && <p className="mt-2 text-sm text-slate-200">{creators.join(', ')}</p>}
                    {leadCreatorNames.length > 0 && <p className="mt-1 text-xs text-slate-300">Lead author: {leadCreatorNames.join(', ')}</p>}
                </div>
                <div className="space-y-1 px-6 py-5">
                    {loading ? (
                        <p role="status" className="py-4 text-sm text-muted-foreground">
                            Fetching research details...
                        </p>
                    ) : error ? (
                        <p role="alert" className="py-4 text-sm text-destructive">
                            {error}
                        </p>
                    ) : (
                        <>
                            {abstract && (
                                <section className="border-b py-3">
                                    <h3 className="mb-2 text-sm font-semibold">Abstract</h3>
                                    <p className="text-sm leading-6 whitespace-pre-wrap">{abstract}</p>
                                </section>
                            )}
                            {(systemInfo || thematicTags) && (
                                <section className="border-b py-3">
                                    <h3 className="mb-2 text-sm font-semibold">Research details</h3>
                                    <div className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
                                        {systemInfo && (
                                            <>
                                                <div className="font-semibold">Completion date</div>
                                                <div>{systemInfo.completionDate || '—'}</div>
                                                <div className="font-semibold">Program</div>
                                                <div>{systemInfo.program || '—'}</div>
                                                <div className="font-semibold">Adviser</div>
                                                <div>{systemInfo.adviser || '—'}</div>
                                                <div className="font-semibold">Status</div>
                                                <div>{systemInfo.status || '—'}</div>
                                            </>
                                        )}
                                        {thematicTags?.keywords && (
                                            <>
                                                <div className="font-semibold">Keywords</div>
                                                <div>{thematicTags.keywords.join(', ') || '—'}</div>
                                            </>
                                        )}
                                        {thematicTags?.panelists && thematicTags.panelists.length > 0 && (
                                            <>
                                                <div className="font-semibold">Panelists</div>
                                                <div>{thematicTags.panelists.join(', ')}</div>
                                            </>
                                        )}
                                        {thematicTags?.agendas && (
                                            <>
                                                <div className="font-semibold">Agenda</div>
                                                <div>{thematicTags.agendas.join(', ') || '—'}</div>
                                            </>
                                        )}
                                        {thematicTags?.sdgs && (
                                            <>
                                                <div className="font-semibold">SDG</div>
                                                <div>{thematicTags.sdgs.join(', ') || '—'}</div>
                                            </>
                                        )}
                                        {thematicTags?.srigs && (
                                            <>
                                                <div className="font-semibold">SRIG</div>
                                                <div>{thematicTags.srigs.join(', ') || '—'}</div>
                                            </>
                                        )}
                                    </div>
                                </section>
                            )}
                            {values.length > 0 && (
                                <section className="border-b py-3">
                                    <h3 className="mb-1 text-sm font-semibold">Additional catalog metadata</h3>
                                    {values.map((item, index) => (
                                        <CardRow
                                            key={`${item.term}-${index}`}
                                            term={labels[item.term] ?? item.term}
                                            value={item.value}
                                            scheme={item.scheme}
                                            searchTerm={searchTerm}
                                        />
                                    ))}
                                </section>
                            )}
                            <section className="mt-2 border-t pt-3">
                                <h3 className="mb-2 text-sm font-semibold">Library information</h3>
                                <div className="grid grid-cols-[8rem_1fr] gap-4 text-sm">
                                    <div className="font-semibold">Location</div>
                                    <div>{hardboundLocation || '—'}</div>
                                    <div className="font-semibold">Availability</div>
                                    <div>{physicalAvailability ? 'Available' : 'Not available'}</div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
                {(editHref || onEdit) && (
                    <div className="flex justify-end border-t px-6 py-4">
                        {onEdit ? (
                            <Button onClick={onEdit}>Edit research entry</Button>
                        ) : (
                            <Button asChild>
                                <Link href={editHref!}>Edit metadata</Link>
                            </Button>
                        )}
                    </div>
                )}
                {extraContent}
                {activity?.canView && <ResearchActivityDisclosure researchId={activity.researchId} />}
            </DialogContent>
        </Dialog>
    );
}

function CardRow({ term, value, scheme, searchTerm }: { term: string; value: string; scheme?: string | null; searchTerm?: string }) {
    return (
        <div className="grid grid-cols-[8rem_1fr] gap-4 border-b py-3 last:border-b-0">
            <div className="text-sm font-semibold">{term}</div>
            <div className="text-sm whitespace-pre-wrap">
                {highlightText(value, searchTerm)}
                {scheme && <span className="ml-2 text-xs text-muted-foreground">({scheme})</span>}
            </div>
        </div>
    );
}

function highlightText(text: string, searchTerm?: string): ReactNode {
    if (!searchTerm || !text) return text;
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');

    return text.split(regex).map((part, index) =>
        part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={index} className="rounded bg-yellow-200 px-0.5 font-medium text-gray-900">
                {part}
            </mark>
        ) : (
            part
        ),
    );
}
