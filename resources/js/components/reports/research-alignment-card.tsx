import ReportPreviewModal from '@/components/modals/report-preview-modal';
import ReportResultsActions from '@/components/reports/report-results-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { refreshCsrfToken } from '@/lib/csrf';
import { formatName } from '@/lib/report-format';
import type { Faculty, Program } from '@/types/reports';
import { LoaderCircle, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Category = 'sdg' | 'srig' | 'agenda';
type ExportFormat = 'pdf' | 'docx';
type Filters = { category: Category; year: string; program: string; adviser: string; status: string; items: number[] };
type AlignmentItem = { id: number; code: string; name: string; matchingPapers: number; share: number };
type MatchingPaper = { id: number; title: string; program: string | null; adviser: string | null; year: number | null; status: string };
type Results = { category: string; matchingPapers: number; itemsShown: number; itemsWithPapers: number; items: AlignmentItem[] };

interface Props {
    programs: Program[];
    years: number[];
    advisers: Faculty[];
    dataUrl?: string;
    previewUrl?: string;
    exportUrl?: string;
}

const defaultFilters: Filters = { category: 'sdg', year: 'all', program: 'all', adviser: 'all', status: 'posted', items: [] };
const statuses = [
    { value: 'posted', label: 'Posted' },
    { value: 'all', label: 'All active statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'draft_invited', label: 'Draft (Invited)' },
    { value: 'submitted', label: 'Submitted for Review' },
    { value: 'returned', label: 'Returned for Revision' },
];

const makeQuery = (values: Filters, itemId?: number) => {
    const params = new URLSearchParams({ category: values.category, status: values.status });
    if (values.year !== 'all') params.set('year', values.year);
    if (values.program !== 'all') params.set('program', values.program);
    if (values.adviser !== 'all') params.set('adviser', values.adviser);
    values.items.forEach((id) => params.append('items[]', String(id)));
    if (itemId !== undefined) params.set('item_id', String(itemId));
    return params;
};

const requestBody = (values: Filters, format?: ExportFormat) => ({
    category: values.category,
    year: values.year === 'all' ? null : Number(values.year),
    program: values.program === 'all' ? null : Number(values.program),
    adviser: values.adviser === 'all' ? null : Number(values.adviser),
    status: values.status,
    items: values.items,
    ...(format ? { format } : {}),
});

const responseError = async (response: Response, action: string) => {
    let detail = '';
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        try {
            const payload = await response.json();
            detail =
                typeof payload.message === 'string'
                    ? payload.message
                    : Object.values(payload.errors ?? {})
                          .flat()
                          .join(' ');
        } catch {
            detail = '';
        }
    } else {
        const body = await response.text();
        if (!body.trimStart().startsWith('<')) detail = body.trim().slice(0, 300);
    }

    return new Error(
        `${action} failed (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''})${detail ? `: ${detail}` : '.'}`,
    );
};

export default function ResearchAlignmentCard({
    programs,
    years,
    advisers,
    dataUrl = '/admin/reports/alignment-data',
    previewUrl = '/admin/reports/alignment-preview',
    exportUrl = '/admin/reports/alignment-export',
}: Props) {
    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);
    const [results, setResults] = useState<Results | null>(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');
    const [papersOpen, setPapersOpen] = useState(false);
    const [selectedPaperItem, setSelectedPaperItem] = useState<AlignmentItem | null>(null);
    const [matchingPapers, setMatchingPapers] = useState<MatchingPaper[] | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFileUrl, setPreviewFileUrl] = useState('');

    const load = useCallback(
        async (values: Filters, itemId?: number): Promise<{ results: Results; papers: MatchingPaper[] | null } | null> => {
            try {
                const response = await fetch(`${dataUrl}?${makeQuery(values, itemId).toString()}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                if (!response.ok) throw await responseError(response, 'Loading research alignment results');
                const data = await response.json();
                if (typeof data.category !== 'string' || typeof data.matchingPapers !== 'number' || !Array.isArray(data.items)) {
                    throw new Error('The alignment results endpoint returned an unexpected response. Expected category, matchingPapers, and items.');
                }
                return { results: data as Results, papers: data.papers as MatchingPaper[] | null };
            } catch (cause) {
                setError(
                    cause instanceof TypeError
                        ? 'Network error while loading research alignment results. Check your connection and try again.'
                        : cause instanceof Error
                          ? cause.message
                          : 'Network error while loading research alignment results.',
                );
                return null;
            }
        },
        [dataUrl],
    );

    useEffect(() => {
        let active = true;
        void load(defaultFilters).then((data) => {
            if (active && data) setResults(data.results);
            if (active) setLoadingOptions(false);
        });
        return () => {
            active = false;
        };
    }, [load]);

    useEffect(
        () => () => {
            if (previewFileUrl) URL.revokeObjectURL(previewFileUrl);
        },
        [previewFileUrl],
    );

    const invalidateResults = () => {
        setHasApplied(false);
        setPapersOpen(false);
        setError('');
    };

    const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
        invalidateResults();
        setFilters((current) => ({ ...current, [key]: value, ...(key === 'category' ? { items: [] } : {}) }));
        if (key === 'category')
            void load({ ...filters, category: value as Category, items: [] }).then((data) => {
                if (data) setResults(data.results);
            });
    };

    const apply = async () => {
        setLoadingResults(true);
        setError('');
        const next = { ...filters, items: [...filters.items] };
        const data = await load(next);
        if (data) {
            setResults(data.results);
            setAppliedFilters(next);
            setHasApplied(true);
        }
        setLoadingResults(false);
    };

    const clearItems = () => {
        invalidateResults();
        setFilters((current) => ({ ...current, items: [] }));
    };

    const reset = () => {
        invalidateResults();
        setFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        void load(defaultFilters).then((data) => {
            if (data) setResults(data.results);
        });
    };

    const visibleItems = results?.items ?? [];
    const selectableItems = results?.category.toLowerCase() === filters.category ? visibleItems : [];

    const openPapers = async (item: AlignmentItem) => {
        setSelectedPaperItem(item);
        setMatchingPapers(null);
        setPapersOpen(true);
        const data = await load(appliedFilters, item.id);
        setMatchingPapers(data?.papers ?? []);
    };

    const postFile = async (url: string, body: Record<string, unknown>, accept: string) => {
        const csrfToken = await refreshCsrfToken();
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: accept,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            throw await responseError(response, 'Generating the alignment report');
        }
        return response;
    };

    const preview = async () => {
        setError('');
        try {
            const response = await postFile(previewUrl, requestBody(appliedFilters), 'application/pdf');
            const nextUrl = URL.createObjectURL(await response.blob());
            if (previewFileUrl) URL.revokeObjectURL(previewFileUrl);
            setPreviewFileUrl(nextUrl);
            setPreviewOpen(true);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to generate the PDF preview.');
        }
    };

    const exportReport = async (format: ExportFormat) => {
        setIsExporting(true);
        setError('');
        try {
            const response = await postFile(exportUrl, requestBody(appliedFilters, format), '*/*');
            const blobUrl = URL.createObjectURL(await response.blob());
            const disposition = response.headers.get('Content-Disposition') ?? '';
            const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? `research-alignment-report.${format}`;
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Unable to export the report.');
        } finally {
            setIsExporting(false);
        }
    };

    const toggleItem = (item: AlignmentItem) => {
        invalidateResults();
        setFilters((current) => ({
            ...current,
            items: current.items.includes(item.id) ? current.items.filter((id) => id !== item.id) : [...current.items, item.id],
        }));
    };

    const resultsDescription = useMemo(() => `Results (${results?.matchingPapers ?? 0} records)`, [results?.matchingPapers]);

    return (
        <div className="research-alignment-report space-y-6">
            <style>{`@media print { .research-alignment-print-hide, [data-sidebar], [data-sidebar="sidebar"], aside { display: none !important; } .research-alignment-report { padding: 0 !important; } body { background: white !important; } }`}</style>
            <Card className="research-alignment-print-hide">
                <CardHeader>
                    <CardTitle>Research Alignment</CardTitle>
                    <CardDescription>Compare active research papers against the managed alignment items.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <FilterSelect
                            label="Alignment category"
                            value={filters.category}
                            onChange={(value) => updateFilter('category', value as Category)}
                        >
                            <SelectItem value="sdg">SDG</SelectItem>
                            <SelectItem value="srig">SRIG</SelectItem>
                            <SelectItem value="agenda">Agenda</SelectItem>
                        </FilterSelect>
                        <FilterSelect label="Completed year" value={filters.year} onChange={(value) => updateFilter('year', value)}>
                            <SelectItem value="all">All years</SelectItem>
                            {years.map((year) => (
                                <SelectItem key={year} value={String(year)}>
                                    {year}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                        <FilterSelect label="Program" value={filters.program} onChange={(value) => updateFilter('program', value)}>
                            <SelectItem value="all">All programs</SelectItem>
                            {programs.map((program) => (
                                <SelectItem key={program.id} value={String(program.id)}>
                                    {program.name}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                        <FilterSelect label="Adviser" value={filters.adviser} onChange={(value) => updateFilter('adviser', value)}>
                            <SelectItem value="all">All advisers</SelectItem>
                            {advisers.map((adviser) => (
                                <SelectItem key={adviser.id} value={String(adviser.id)}>
                                    {formatName(adviser)}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                        <FilterSelect label="Research status" value={filters.status} onChange={(value) => updateFilter('status', value)}>
                            {statuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                    </div>

                    <div className="space-y-3 rounded-lg border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-medium">Optional alignment items</p>
                                <p className="text-xs text-muted-foreground">No items selected includes every item in this category.</p>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={clearItems}>
                                Clear item selection
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectableItems.map((item) => {
                                const checked = filters.items.includes(item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        aria-pressed={checked}
                                        onClick={() => toggleItem(item)}
                                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${checked ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                                    >
                                        {item.code} {item.name}
                                    </button>
                                );
                            })}
                            {loadingOptions && <p className="text-sm text-muted-foreground">Loading alignment items…</p>}
                            {!loadingOptions && selectableItems.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {results?.category.toLowerCase() !== filters.category
                                        ? 'Apply the category to load its alignment items.'
                                        : 'No alignment items are configured for this category.'}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" onClick={() => void apply()} disabled={loadingResults}>
                            {loadingResults && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Apply filters
                        </Button>
                        <Button type="button" variant="outline" onClick={reset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {!hasApplied && !error && (
                <p className="text-sm text-muted-foreground">Choose your filters and apply them to view results and export the report.</p>
            )}
            {error && (
                <Card>
                    <CardContent className="py-5 text-sm text-destructive" role="alert">
                        {error}
                    </CardContent>
                </Card>
            )}
            {loadingResults && hasApplied && (
                <Card>
                    <CardContent className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Refreshing alignment results…
                    </CardContent>
                </Card>
            )}
            {hasApplied && !loadingResults && !error && results && (
                <>
                    <div className="space-y-4">
                        <ReportResultsActions
                            title={resultsDescription}
                            description="Research papers matching the applied filters"
                            disabled={results.matchingPapers === 0}
                            isExporting={isExporting}
                            formats={['pdf', 'docx']}
                            onPreview={() => void preview()}
                            onExport={(format) => void exportReport(format)}
                        />
                        {results.matchingPapers === 0 && <p className="text-sm text-muted-foreground">No research papers match these filters.</p>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        <SummaryCard label="Matching research papers" value={results.matchingPapers} />
                        <SummaryCard label="Alignment items shown" value={results.itemsShown} />
                        <SummaryCard label="Items with at least one matching paper" value={results.itemsWithPapers} />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Alignment breakdown</CardTitle>
                            <CardDescription>Click an item to view its matching research papers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item code</TableHead>
                                        <TableHead>Alignment item</TableHead>
                                        <TableHead className="text-right">Papers</TableHead>
                                        <TableHead>Share of matching papers</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleItems.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            tabIndex={0}
                                            role="button"
                                            onClick={() => void openPapers(item)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') void openPapers(item);
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <TableCell>
                                                <Badge variant="outline">{item.code}</Badge>
                                            </TableCell>
                                            <TableCell>{item.name}</TableCell>
                                            <TableCell className="text-right tabular-nums">{item.matchingPapers}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <span className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-muted">
                                                        <span
                                                            className="block h-full rounded-full bg-primary"
                                                            style={{ width: `${Math.min(100, item.share)}%` }}
                                                        />
                                                    </span>
                                                    <span className="w-14 text-right tabular-nums">{item.share}%</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <p className="text-sm text-muted-foreground">
                        A paper can align with more than one item, so percentages may total more than 100%.
                    </p>
                </>
            )}

            <Dialog open={papersOpen} onOpenChange={setPapersOpen}>
                <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Matching research papers</DialogTitle>
                        <DialogDescription>
                            {selectedPaperItem
                                ? `${selectedPaperItem.code} ${selectedPaperItem.name}`
                                : 'Papers associated with this alignment item.'}
                        </DialogDescription>
                    </DialogHeader>
                    {matchingPapers === null ? (
                        <div className="flex items-center gap-2 py-8 text-muted-foreground">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Loading papers…
                        </div>
                    ) : matchingPapers.length ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Adviser</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {matchingPapers.map((paper) => (
                                    <TableRow key={paper.id}>
                                        <TableCell>
                                            <a
                                                className="font-medium text-primary underline-offset-4 hover:underline"
                                                href={`/research/${paper.id}/details`}
                                            >
                                                {paper.title}
                                            </a>
                                        </TableCell>
                                        <TableCell>{paper.program ?? '—'}</TableCell>
                                        <TableCell>{paper.adviser ?? '—'}</TableCell>
                                        <TableCell>{paper.year ?? '—'}</TableCell>
                                        <TableCell>{paper.status}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">No matching papers for this item.</p>
                    )}
                </DialogContent>
            </Dialog>
            <ReportPreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title="Research Alignment Report Preview"
                previewUrl={previewFileUrl}
            />
        </div>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <Card>
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
            </CardContent>
        </Card>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    children,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">{label}</p>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>{children}</SelectContent>
            </Select>
        </div>
    );
}
