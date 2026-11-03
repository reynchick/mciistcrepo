import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
    editHref?: string;
    physicalAttributes?: { hardboundLocation?: string | null; physicalAvailability?: boolean } | null;
    systemInfo?: {
        completionDate?: string;
        adviser?: string;
        status?: string | null;
        program?: string;
    };
    thematicTags?: {
        keywords?: string[];
        agendas?: string[];
        sdgs?: string[];
        srigs?: string[];
    };
    leadCreatorNames?: string[];
    extraContent?: ReactNode;
};

export default function CardScreenModal({ open, onOpenChange, fallbackTitle, metadata, fallbackMetadata = [], editHref, physicalAttributes, systemInfo, thematicTags, leadCreatorNames = [], extraContent }: Props) {
    const metadataTerms = new Set(metadata.map((item) => item.term));
    const combinedMetadata = [
        ...metadata,
        ...fallbackMetadata.filter((item) => item.term === 'creator' || !metadataTerms.has(item.term)),
    ];
    const sortedValues = [...combinedMetadata].sort((a, b) => {
        const aOrder = dublinCoreOrder.indexOf(a.term);
        const bOrder = dublinCoreOrder.indexOf(b.term);
        return (aOrder < 0 ? dublinCoreOrder.length : aOrder) - (bOrder < 0 ? dublinCoreOrder.length : bOrder)
            || (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    const creatorValues = sortedValues.filter((item) => item.term === 'creator');
    const values = [
        ...sortedValues.filter((item) => item.term !== 'creator'),
        ...(creatorValues.length > 0
            ? [{
                term: 'creator',
                value: creatorValues.map((item) => item.value).join(', '),
                scheme: creatorValues.find((item) => item.scheme)?.scheme ?? null,
                sort_order: Math.min(...creatorValues.map((item) => item.sort_order ?? 0)),
            }]
            : []),
    ].sort((a, b) => {
        const aOrder = dublinCoreOrder.indexOf(a.term);
        const bOrder = dublinCoreOrder.indexOf(b.term);
        return (aOrder < 0 ? dublinCoreOrder.length : aOrder) - (bOrder < 0 ? dublinCoreOrder.length : bOrder)
            || (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    const hasTitle = values.some((item) => item.term === 'title');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-4xl lg:max-w-5xl">
                <div className="bg-slate-800 px-6 py-4 text-white">
                    <h2 className="text-lg font-semibold">Card Screen</h2>
                </div>
                <div className="space-y-1 px-6 py-5">
                    {systemInfo && (
                        <div className="mb-3 grid grid-cols-[8rem_1fr] gap-4 border-b pb-3 text-sm">
                            <div className="font-semibold">Completion date</div><div>{systemInfo.completionDate || '—'}</div>
                            <div className="font-semibold">Adviser</div><div>{systemInfo.adviser || '—'}</div>
                            <div className="font-semibold">Status</div><div>{systemInfo.status || '—'}</div>
                            <div className="font-semibold">Program</div><div>{systemInfo.program || '—'}</div>
                        </div>
                    )}
                    {!hasTitle && <CardRow term="title" value={fallbackTitle} />}
                    {values.length > 0 ? values.map((item, index) => (
                        <CardRow
                            key={`${item.term}-${index}`}
                            term={labels[item.term] ?? item.term}
                            value={item.value}
                            scheme={item.scheme}
                            suffix={item.term === 'creator' && leadCreatorNames.length > 0 ? `Lead author: ${leadCreatorNames.join(', ')}` : undefined}
                        />
                    )) : <p className="py-4 text-sm text-muted-foreground">No metadata has been entered yet.</p>}
                    {thematicTags && (
                        <div className="mt-2 grid grid-cols-[8rem_1fr] gap-4 border-t pt-3 text-sm">
                            <div className="font-semibold">Keywords</div><div>{thematicTags.keywords?.join(', ') || '—'}</div>
                            <div className="font-semibold">Agenda</div><div>{thematicTags.agendas?.join(', ') || '—'}</div>
                            <div className="font-semibold">SDG</div><div>{thematicTags.sdgs?.join(', ') || '—'}</div>
                            <div className="font-semibold">SRIG</div><div>{thematicTags.srigs?.join(', ') || '—'}</div>
                        </div>
                    )}
                    <div className="mt-2 grid grid-cols-[8rem_1fr] gap-4 border-t pt-3 text-sm">
                        <div className="font-semibold">Location</div><div>{physicalAttributes?.hardboundLocation || '—'}</div>
                        <div className="font-semibold">Availability</div><div>{physicalAttributes?.physicalAvailability ? 'Available' : 'Not available'}</div>
                    </div>
                </div>
                {editHref && (
                    <div className="flex justify-end border-t px-6 py-4">
                        <Button asChild><Link href={editHref}>Edit metadata</Link></Button>
                    </div>
                )}
                {extraContent}
            </DialogContent>
        </Dialog>
    );
}

function CardRow({ term, value, scheme, suffix }: { term: string; value: string; scheme?: string | null; suffix?: string }) {
    return (
        <div className="grid grid-cols-[8rem_1fr] gap-4 border-b py-3 last:border-b-0">
            <div className="text-sm font-semibold">{term}</div>
            <div className="whitespace-pre-wrap text-sm">
                {value}
                {suffix && <span className="ml-2 text-xs font-medium text-muted-foreground">({suffix})</span>}
                {scheme && <span className="ml-2 text-xs text-muted-foreground">({scheme})</span>}
            </div>
        </div>
    );
}
