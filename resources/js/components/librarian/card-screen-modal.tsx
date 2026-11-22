import ResearchActivityDisclosure from '@/components/research/research-activity-disclosure';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Link } from '@inertiajs/react';
import { BadgeCheck, BookOpen, CalendarDays, GraduationCap, MapPin, UserRound, X } from 'lucide-react';
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

// Short values sit two per row; everything else spans the full width.
const shortTerms = new Set(['publisher', 'date', 'type', 'format', 'identifier', 'language']);

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fallbackTitle: string;
    abstract?: string | null;
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
    activity?: { researchId: number; canView: boolean };
    loading?: boolean;
    error?: string | null;
    searchTerm?: string;
};

export default function CardScreenModal({
    open,
    onOpenChange,
    fallbackTitle,
    abstract,
    metadata,
    fallbackMetadata = [],
    editHref,
    physicalAttributes,
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
    const creatorValues = sortedValues
        .filter((item) => item.term === 'creator')
        .filter(
            (item, index, values) =>
                values.findIndex((candidate) => candidate.value.trim().toLowerCase() === item.value.trim().toLowerCase()) === index,
        );
    const values = [
        ...sortedValues.filter((item) => item.term !== 'creator' && item.term !== 'title'),
        ...(creatorValues.length > 0
            ? [
                  {
                      term: 'creator',
                      value: creatorValues.map((item) => item.value).join(', '),
                      scheme: creatorValues.find((item) => item.scheme)?.scheme ?? null,
                      sort_order: Math.min(...creatorValues.map((item) => item.sort_order ?? 0)),
                  },
              ]
            : []),
    ].sort((a, b) => {
        const aOrder = dublinCoreOrder.indexOf(a.term);
        const bOrder = dublinCoreOrder.indexOf(b.term);
        return (
            (aOrder < 0 ? dublinCoreOrder.length : aOrder) - (bOrder < 0 ? dublinCoreOrder.length : bOrder) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
    });

    const tagGroups = [
        { label: 'Keywords', items: thematicTags?.keywords },
        { label: 'Agenda', items: thematicTags?.agendas },
        { label: 'SDG', items: thematicTags?.sdgs },
        { label: 'SRIG', items: thematicTags?.srigs },
    ];

    const detailRows = [
        { icon: CalendarDays, text: systemInfo?.completionDate },
        { icon: UserRound, text: systemInfo?.adviser ? `Adviser: ${systemInfo.adviser}` : undefined },
        { icon: GraduationCap, text: systemInfo?.program },
        { icon: BadgeCheck, text: systemInfo?.status },
        { icon: MapPin, text: physicalAttributes?.hardboundLocation },
    ];

    const available = !!physicalAttributes?.physicalAvailability;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto rounded-3xl border-0 bg-[#00296b] p-2 shadow-2xl sm:max-w-5xl md:overflow-hidden lg:max-w-6xl [&>button]:hidden">
                <DialogDescription className="sr-only">Research details and metadata</DialogDescription>

                <div className="grid gap-2 md:max-h-[84vh] md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    {/* LEFT: summary panel */}
                    <aside className="flex flex-col px-6 py-6 text-white md:px-8 md:py-8">
                        <div className="flex size-9 items-center justify-center rounded-full bg-white text-[#00296b]">
                            <BookOpen className="size-4" />
                        </div>

                        <div className="mt-10 space-y-2">
                            {leadCreatorNames.length > 0 && <p className="text-sm text-white/70">{leadCreatorNames.join(', ')}</p>}
                            <DialogTitle className="text-2xl leading-snug font-semibold text-white md:text-3xl">
                                {highlightText(fallbackTitle, searchTerm)}
                            </DialogTitle>
                        </div>

                        {!loading && !error && (
                            <ul className="mt-8 space-y-4 text-sm">
                                {detailRows
                                    .filter((row) => row.text)
                                    .map(({ icon: Icon, text }, index) => (
                                        <li key={index} className="flex items-start gap-3 text-white/90">
                                            <Icon className="mt-0.5 size-4 shrink-0 text-white/60" />
                                            <span className="min-w-0 break-words">{text}</span>
                                        </li>
                                    ))}
                            </ul>
                        )}

                        {editHref && (
                            <div className="mt-8 md:mt-auto md:pt-8">
                                <Button asChild className="w-full bg-white text-[#00296b] hover:bg-white/90">
                                    <Link href={editHref}>Edit metadata</Link>
                                </Button>
                            </div>
                        )}
                    </aside>

                    {/* RIGHT: details panel */}
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white text-slate-900">
                        <header className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-sm font-medium text-slate-700">Research Details</h2>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                aria-label="Close"
                                className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[#00509D] focus-visible:outline-none"
                            >
                                <X className="size-4" />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
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
                                    <Field label="Abstract" value={abstract?.trim() || '—'} searchTerm={searchTerm} />

                                    {values.length > 0 ? (
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            {values.map((item, index) => (
                                                <Field
                                                    key={`${item.term}-${index}`}
                                                    label={labels[item.term] ?? item.term}
                                                    value={item.value}
                                                    scheme={item.scheme}
                                                    suffix={
                                                        item.term === 'creator' && leadCreatorNames.length > 0
                                                            ? `Lead author: ${leadCreatorNames.join(', ')}`
                                                            : undefined
                                                    }
                                                    searchTerm={searchTerm}
                                                    className={shortTerms.has(item.term) ? '' : 'sm:col-span-2'}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No metadata has been entered yet.</p>
                                    )}

                                    {thematicTags && (
                                        <div className="space-y-4 border-t pt-5">
                                            {tagGroups.map((group) => (
                                                <div key={group.label} className="space-y-2">
                                                    <p className="text-sm font-medium">{group.label}</p>
                                                    {group.items && group.items.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {group.items.map((item) => (
                                                                <span
                                                                    key={item}
                                                                    className="inline-flex items-center rounded-md bg-[#00296b]/10 px-2.5 py-1 text-xs font-medium text-[#00296b]"
                                                                >
                                                                    {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">—</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {extraContent}
                                    {activity?.canView && <ResearchActivityDisclosure researchId={activity.researchId} />}
                                </>
                            )}
                        </div>

                        <footer className="flex items-center justify-between gap-3 border-t px-6 py-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className={`size-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                {available ? 'Hardbound copy available' : 'Hardbound copy not available'}
                            </div>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Close
                            </Button>
                        </footer>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    value,
    scheme,
    suffix,
    searchTerm,
    className = '',
}: {
    label: string;
    value: string;
    scheme?: string | null;
    suffix?: string;
    searchTerm?: string;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <p className="text-sm font-medium">{label}</p>
            <div className="rounded-lg border bg-slate-50 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                {highlightText(value, searchTerm)}
                {suffix && <span className="ml-2 text-xs font-medium text-muted-foreground">({suffix})</span>}
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