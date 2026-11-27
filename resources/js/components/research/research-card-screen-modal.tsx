import ManuscriptPreviewDialog from '@/components/manuscript-preview/manuscript-preview-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, GraduationCap, Eye } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

interface MetadataValue {
    term: string;
    value: string;
    scheme?: string | null;
    sort_order?: number;
}

interface ResearchDetailsPayload {
    id: number;
    status: string | null;
    research_title: string;
    program: { id: number; name: string; code?: string | null } | null;
    completed_month: number | null;
    completed_year: number | null;
    research_abstract: string;
    hardbound_location?: string | null;
    physical_availability?: boolean;
    metadata_values: MetadataValue[];
    has_manuscript: boolean;
    manuscript_unavailable?: boolean;
    panelists_unavailable?: boolean;
    adviser: { id: number; name: string | null } | null;
    researchers: Array<{ id: number; name: string; is_lead_author: boolean }>;
    panelists: Array<{ id: number; name: string }>;
    keywords: Array<{ id: number; keyword_name: string }>;
    agendas: Array<{ id: number; name: string }>;
    sdgs: Array<{ id: number; name: string }>;
    srigs: Array<{ id: number; name: string }>;
    can_download_files: boolean;
    can_view_activity: boolean;
}

interface Props {
    id: number | null;
    onClose: () => void;
    searchTerm?: string;
}

const monthName = (month: number | null) => {
    if (!month) return '';
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
};

const termKey = (term: string) => (term.split(/[:.]/).pop() ?? term).toLowerCase();

const termLabel = (term: string) => {
    const words = (term.split(/[:.]/).pop() ?? term)
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2');

    return words.charAt(0).toUpperCase() + words.slice(1);
};

const initials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
};

function Highlight({ text, term }: { text: string; term?: string }) {
    const query = term?.trim();

    if (!query) return <>{text}</>;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

    return (
        <>
            {parts.map((part, index) =>
                index % 2 === 1 ? (
                    <mark key={index} className="rounded-sm bg-yellow-200 px-0.5 text-slate-900">
                        {part}
                    </mark>
                ) : (
                    part
                ),
            )}
        </>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="min-w-0 space-y-2">
            <h3 className="text-sm font-semibold">{title}</h3>
            {children}
        </section>
    );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex min-w-0 items-center gap-3 rounded-lg bg-muted/35 px-3 py-2.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <dt className="shrink-0 text-xs font-medium text-muted-foreground">
                    {label}
                </dt>
                <dd className="min-w-0 flex-1 text-sm leading-snug font-medium break-words">
                    {children}
                </dd>
            </div>
        </div>
    );
}

function TagSection({
    title,
    items,
    term,
}: {
    title: string;
    items: string[];
    term?: string;
}) {
    if (items.length === 0) return null;

    return (
        <Section title={title}>
            <ul className="flex flex-wrap gap-1.5">
                {items.map((item, index) => (
                    <li
                        key={`${item}-${index}`}
                        className="rounded-xl bg-muted/40 px-3 py-1 text-xs leading-relaxed"
                    >
                        <Highlight text={item} term={term} />
                    </li>
                ))}
            </ul>
        </Section>
    );
}

function FloatingPill({
    children,
    icon: Icon,
    className = '',
}: {
    children: ReactNode;
    icon?: typeof GraduationCap;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs backdrop-blur ${className}`}
        >
            {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
            <span className="truncate">{children}</span>
        </span>
    );
}

export default function ResearchCardScreenModal({
    id,
    onClose,
    searchTerm,
}: Props) {
    const [data, setData] = useState<ResearchDetailsPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const loggedRef = useRef<Record<number, number>>({});

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        setLoading(true);
        setError(null);
        setData(null);
        setPreviewOpen(false);

        fetch(`/research/${id}/details`, {
            headers: { Accept: 'application/json' },
        })
            .then((response) => {
                if (!response.ok) throw new Error('Failed to load details');
                return response.json();
            })
            .then((json) => {
                if (!cancelled) setData(json.data as ResearchDetailsPayload);
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    setError(
                        cause instanceof Error
                            ? cause.message
                            : 'Unable to load details',
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const now = Date.now();
        const last = loggedRef.current[id] ?? 0;

        if (now - last < 5 * 60 * 1000) return;

        const timer = setTimeout(() => {
            const currentLast = loggedRef.current[id] ?? 0;

            if (Date.now() - currentLast < 5 * 60 * 1000) return;

            loggedRef.current[id] = Date.now();

            const token = (
                document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
            )?.content;

            fetch('/api/research-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({
                    research_id: id,
                    action: 'details_view',
                }),
                credentials: 'same-origin',
            }).catch(() => {
                // Access logging must not block viewing research details.
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [id]);

    const handleDownload = () => {
        if (!data?.can_download_files) return;
        window.location.href = `/research/${data.id}/manuscript`;
    };

    if (!id) return null;

    const metadata = [...(data?.metadata_values ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );

    const metadataFirst = (key: string) =>
        metadata.find((item) => termKey(item.term) === key)?.value;

    const title = metadataFirst('title') || data?.research_title || '';
    const abstract = data?.research_abstract || metadataFirst('abstract') || '';
    const researchers = data?.researchers ?? [];

    const completionDate = data
        ? [monthName(data.completed_month), data.completed_year]
              .filter(Boolean)
              .join(' ')
        : '';

    const program = data?.program
        ? [data.program.code, data.program.name].filter(Boolean).join(' – ')
        : '';

    const extraMetadata = metadata.reduce<Record<string, string[]>>(
        (groups, item) => {
            if (['title', 'abstract', 'creator'].includes(termKey(item.term))) {
                return groups;
            }

            (groups[item.term] ??= []).push(item.value);
            return groups;
        },
        {},
    );

    return (
        <>
            <Dialog
                open={id !== null}
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <DialogContent
                    className="flex h-[92vh] max-h-[92vh] w-[calc(100%-2rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl border-0 !border-transparent bg-background p-0 shadow-2xl ring-0 outline-none sm:max-w-6xl lg:h-[88vh] lg:flex-row lg:overflow-hidden [&>button]:z-20 [&>button]:flex [&>button]:size-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:bg-background [&>button]:text-foreground [&>button]:opacity-100"
                >
                    {/* Left: Research identity panel */}
                    <aside className="relative flex shrink-0 flex-col overflow-hidden bg-gradient-to-br from-[#020817] via-[#08245c] to-[#1553b7] text-white lg:w-[42%]">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"
                        />

                        <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-6 p-6 sm:p-7 lg:p-8">
                            <div className="flex items-center gap-3">
                                <span className="flex size-9 items-center justify-center rounded-full bg-white text-blue-800">
                                    <BookOpen className="size-[18px]" aria-hidden="true" />
                                </span>

                                <span className="text-sm font-semibold">
                                    Research Record
                                </span>
                            </div>

                            <div className="my-auto space-y-5">
                                {data?.status && (
                                    <div className="flex justify-end">
                                        <FloatingPill className="capitalize">
                                            {data.status.replace(/_/g, ' ')}
                                        </FloatingPill>
                                    </div>
                                )}

                                <DialogTitle
                                    className="text-left leading-[1.15] font-medium tracking-tight break-words [overflow-wrap:anywhere]"
                                    style={{
                                        fontSize:
                                            title.length > 140
                                                ? 'clamp(1rem, 1.25vw, 1.25rem)'
                                                : title.length > 95
                                                  ? 'clamp(1.05rem, 1.55vw, 1.5rem)'
                                                  : title.length > 60
                                                    ? 'clamp(1.1rem, 1.8vw, 1.7rem)'
                                                    : 'clamp(1.15rem, 2.1vw, 1.9rem)',
                                    }}
                                >
                                    {title ? (
                                        <Highlight text={title} term={searchTerm} />
                                    ) : (
                                        'Research details'
                                    )}
                                </DialogTitle>

                                <DialogDescription className="sr-only">
                                    Details, authors and manuscript access for this research.
                                </DialogDescription>

                                {researchers.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex shrink-0 -space-x-2"
                                            aria-hidden="true"
                                        >
                                            {researchers.slice(0, 5).map((researcher) => (
                                                <span
                                                    key={researcher.id}
                                                    className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[11px] font-semibold text-blue-900"
                                                >
                                                    {initials(researcher.name)}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-xs leading-relaxed text-blue-100">
                                            {researchers.length}{' '}
                                            {researchers.length === 1
                                                ? 'researcher'
                                                : 'researchers'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-between gap-2">
                                {completionDate && (
                                    <FloatingPill>{completionDate}</FloatingPill>
                                )}

                                {data?.program && (
                                    <FloatingPill icon={GraduationCap}>
                                        {data.program.code || data.program.name}
                                    </FloatingPill>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Right: Research details panel */}
                    <div className="flex min-w-0 flex-1 flex-col bg-background lg:min-h-0">
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {error ? (
                                <div
                                    role="alert"
                                    className="flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center"
                                >
                                    <p className="text-sm text-destructive">{error}</p>
                                </div>
                            ) : loading || !data ? (
                                <div
                                    role="status"
                                    className="flex min-h-80 flex-col items-center justify-center gap-4 p-8"
                                >
                                    <div className="size-8 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                                    <p className="text-sm text-muted-foreground">
                                        Loading details…
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-7 p-5 sm:p-7 lg:px-9 lg:py-8">
                                    <header className="space-y-1.5 pr-8">
                                        <h2 className="text-xl font-semibold tracking-tight">
                                            Research Details
                                        </h2>

                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            Explore the abstract, people and classifications behind this study.
                                        </p>
                                    </header>

                                    <Section title="Abstract">
                                        <p className="text-sm leading-6 break-words whitespace-pre-line text-muted-foreground">
                                            {abstract ? (
                                                <Highlight text={abstract} term={searchTerm} />
                                            ) : (
                                                'No abstract available.'
                                            )}
                                        </p>
                                    </Section>

                                    <Section title="Researchers">
                                        {researchers.length > 0 ? (
                                            <ul className="space-y-2">
                                                {researchers.map((researcher) => (
                                                    <li
                                                        key={researcher.id}
                                                        className="flex flex-wrap items-center gap-2 text-sm"
                                                    >
                                                        <span>
                                                            <Highlight
                                                                text={researcher.name}
                                                                term={searchTerm}
                                                            />
                                                        </span>

                                                        {researcher.is_lead_author && (
                                                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                                Lead author
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                No researchers listed.
                                            </p>
                                        )}
                                    </Section>

                                    <dl className="grid grid-cols-1 gap-2.5">
                                        <Fact label="Program">
                                            {program || '—'}
                                        </Fact>

                                        <Fact label="Adviser">
                                            {data.adviser?.name ? (
                                                <Highlight
                                                    text={data.adviser.name}
                                                    term={searchTerm}
                                                />
                                            ) : (
                                                '—'
                                            )}
                                        </Fact>

                                        <Fact label="Completed">
                                            {completionDate || '—'}
                                        </Fact>

                                        <Fact label="Library copy">
                                            {data.physical_availability === undefined
                                                ? '—'
                                                : data.physical_availability
                                                  ? 'Available'
                                                  : 'Not available'}

                                            {data.hardbound_location && (
                                                <span className="block font-normal text-muted-foreground">
                                                    {data.hardbound_location}
                                                </span>
                                            )}
                                        </Fact>
                                    </dl>

                                    {data.panelists_unavailable ? (
                                        <Section title="Panelists">
                                            <p className="text-sm text-muted-foreground">
                                                Panelist information is unavailable.
                                            </p>
                                        </Section>
                                    ) : (
                                        <TagSection
                                            title="Panelists"
                                            items={data.panelists.map((i) => i.name)}
                                            term={searchTerm}
                                        />
                                    )}

                                    <TagSection
                                        title="Keywords"
                                        items={data.keywords.map((i) => i.keyword_name)}
                                        term={searchTerm}
                                    />

                                    <TagSection
                                        title="Research Agendas"
                                        items={data.agendas.map((i) => i.name)}
                                        term={searchTerm}
                                    />

                                    <TagSection
                                        title="Sustainable Development Goals"
                                        items={data.sdgs.map((i) => i.name)}
                                        term={searchTerm}
                                    />

                                    <TagSection
                                        title="SRIGs"
                                        items={data.srigs.map((i) => i.name)}
                                        term={searchTerm}
                                    />

                                    {Object.keys(extraMetadata).length > 0 && (
                                        <Section title="Additional Information">
                                            <dl className="space-y-3">
                                                {Object.entries(extraMetadata).map(
                                                    ([term, values]) => (
                                                        <div
                                                            key={term}
                                                            className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4"
                                                        >
                                                            <dt className="text-sm text-muted-foreground">
                                                                {termLabel(term)}
                                                            </dt>

                                                            <dd className="space-y-1 text-sm leading-relaxed break-words">
                                                                {values.map((value, index) => (
                                                                    <p key={index}>
                                                                        <Highlight
                                                                            text={value}
                                                                            term={searchTerm}
                                                                        />
                                                                    </p>
                                                                ))}
                                                            </dd>
                                                        </div>
                                                    ),
                                                )}
                                            </dl>
                                        </Section>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Manuscript footer */}
                        {data && !error && (
                            <footer className="space-y-4 border-t px-5 py-4 sm:px-7 lg:px-9">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        <Eye className="size-4" aria-hidden="true" />
                                    </span>

                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Manuscript Preview
                                        </h3>

                                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                            {!data.has_manuscript
                                                ? 'No manuscript file is available.'
                                                : data.can_download_files
                                                  ? 'Preview or download the manuscript, or view the full copy in the library.'
                                                  : 'For privacy, only a preview is available; visit the library for the full manuscript.'}
                                        </p>
                                    </div>
                                </div>

                                {data.has_manuscript && (
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button
                                            type="button"
                                            className="h-10 flex-1 rounded-lg bg-blue-700 text-white hover:bg-blue-800"
                                            onClick={() => setPreviewOpen(true)}
                                        >
                                            Preview
                                        </Button>

                                        {data.can_download_files && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-10 flex-1 rounded-lg"
                                                onClick={handleDownload}
                                                aria-label="Download Research Manuscript"
                                            >
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </footer>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {data && (
                <ManuscriptPreviewDialog
                    researchId={data.id}
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    title={data.research_title}
                />
            )}
        </>
    );
}