import ResearchDetailsModal from '@/components/browse/research-details-modal';
import ReportPreviewModal from '@/components/modals/report-preview-modal';
import ReportResultsActions from '@/components/reports/report-results-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { refreshCsrfToken } from '@/lib/csrf';
import type { Program } from '@/types/reports';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type ReportType = 'keywords' | 'access';
type ExportFormat = 'pdf' | 'docx';
type Filters = { type: ReportType; date_range: string; show: string; term: string; program: string };
type KeywordRow = { term: string; searches: number; share: number };
type AccessRow = { researchId: number; title: string; program: string; accesses: number; viewers: number };
type Result = {
    type: ReportType;
    title: string;
    totalRecords: number;
    summary: Record<string, number>;
    items: Array<KeywordRow | AccessRow>;
};

interface Props {
    programs: Program[];
    dataUrl?: string;
    previewUrl?: string;
    exportUrl?: string;
}

const defaults: Filters = { type: 'keywords', date_range: 'last_30_days', show: 'top_10', term: '', program: 'all' };

const errorFromResponse = async (response: Response, action: string) => {
    let detail = '';
    if ((response.headers.get('content-type') ?? '').includes('application/json')) {
        try {
            const body = await response.json();
            detail =
                typeof body.message === 'string'
                    ? body.message
                    : Object.values(body.errors ?? {})
                          .flat()
                          .join(' ');
        } catch {
            /* Use the HTTP status below. */
        }
    } else {
        const body = await response.text();
        if (body.trim() && !body.trimStart().startsWith('<')) detail = body.trim().slice(0, 300);
    }
    return new Error(
        `${action} failed (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''})${detail ? `: ${detail}` : '.'}`,
    );
};

export default function UsageReportsCard({
    programs,
    dataUrl = '/admin/reports/usage-data',
    previewUrl = '/admin/reports/usage-preview',
    exportUrl = '/admin/reports/usage-export',
}: Props) {
    const [filters, setFilters] = useState<Filters>(defaults);
    const [appliedFilters, setAppliedFilters] = useState<Filters | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewFileUrl, setPreviewFileUrl] = useState('');
    const [activeResearchId, setActiveResearchId] = useState<number | null>(null);

    useEffect(
        () => () => {
            if (previewFileUrl) URL.revokeObjectURL(previewFileUrl);
        },
        [previewFileUrl],
    );

    const update = (next: Partial<Filters>) => {
        setFilters((current) => ({ ...current, ...next }));
        setResult(null);
        setAppliedFilters(null);
        setError('');
    };

    const payload = (values: Filters, format?: ExportFormat) => ({
        type: values.type,
        date_range: values.date_range,
        show: values.show,
        ...(values.type === 'keywords' ? { term: values.term.trim() } : { program: values.program === 'all' ? null : Number(values.program) }),
        ...(format ? { format } : {}),
    });

    const apply = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ type: filters.type, date_range: filters.date_range, show: filters.show });
            if (filters.type === 'keywords') {
                if (filters.term.trim()) params.set('term', filters.term.trim());
            } else if (filters.program !== 'all') params.set('program', filters.program);
            const response = await fetch(`${dataUrl}?${params.toString()}`, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!response.ok) throw await errorFromResponse(response, 'Loading usage report');
            const data = await response.json();
            if (
                data.type !== filters.type ||
                typeof data.totalRecords !== 'number' ||
                !Array.isArray(data.items) ||
                typeof data.summary !== 'object'
            ) {
                throw new Error('The usage report endpoint returned an unexpected response.');
            }
            setResult(data as Result);
            setAppliedFilters({ ...filters });
        } catch (cause) {
            setResult(null);
            setAppliedFilters(null);
            setError(
                cause instanceof TypeError
                    ? 'Network error while loading usage report. Check your connection and try again.'
                    : cause instanceof Error
                      ? cause.message
                      : 'Network error while loading usage report.',
            );
        } finally {
            setLoading(false);
        }
    };

    const postFile = async (url: string, values: Filters, format?: ExportFormat) => {
        const csrf = await refreshCsrfToken();
        if (!csrf) throw new Error('Unable to refresh the security token. Reload the page and try again.');
        return fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                Accept: format ? '*/*' : 'application/pdf',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrf,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(payload(values, format)),
        });
    };

    const preview = async () => {
        if (!appliedFilters) return;
        setError('');
        try {
            const response = await postFile(previewUrl, appliedFilters);
            if (!response.ok) throw await errorFromResponse(response, 'Previewing usage report');
            const blobUrl = URL.createObjectURL(await response.blob());
            setPreviewFileUrl((old) => {
                if (old) URL.revokeObjectURL(old);
                return blobUrl;
            });
            setPreviewOpen(true);
        } catch (cause) {
            setError(
                cause instanceof TypeError
                    ? 'Network error while previewing usage report. Check your connection and try again.'
                    : cause instanceof Error
                      ? cause.message
                      : 'Unable to preview usage report.',
            );
        }
    };

    const exportReport = async (format: ExportFormat) => {
        if (!appliedFilters) return;
        setIsExporting(true);
        setError('');
        try {
            const response = await postFile(exportUrl, appliedFilters, format);
            if (!response.ok) throw await errorFromResponse(response, 'Exporting usage report');
            const blob = await response.blob();
            const disposition = response.headers.get('content-disposition') ?? '';
            const filename =
                disposition.match(/filename\*?=(?:UTF-8''|")?([^;"]+)/i)?.[1] ??
                `usage-${appliedFilters.type}.${format}`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = decodeURIComponent(filename.replace(/"/g, ''));
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (cause) {
            setError(
                cause instanceof TypeError
                    ? 'Network error while exporting usage report. Check your connection and try again.'
                    : cause instanceof Error
                      ? cause.message
                      : 'Unable to export usage report.',
            );
        } finally {
            setIsExporting(false);
        }
    };

    const summaries =
        result?.type === 'keywords'
            ? [
                  ['Total searches', result.summary.totalSearches],
                  ['Unique search terms', result.summary.uniqueTerms],
                  ['Terms shown', result.summary.termsShown],
              ]
            : [
                  ['Authenticated accesses', result?.summary.authenticatedAccesses],
                  ['Distinct signed-in users', result?.summary.distinctUsers],
                  ['Research titles shown', result?.summary.titlesShown],
              ];
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Usage report type">
                <Button variant={filters.type === 'keywords' ? 'default' : 'outline'} onClick={() => update({ type: 'keywords' })}>
                    Top searched keywords
                </Button>
                <Button variant={filters.type === 'access' ? 'default' : 'outline'} onClick={() => update({ type: 'access' })}>
                    Research access
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Choose the activity period and how many results to show.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">
                            Date range
                            <Select value={filters.date_range} onValueChange={(value) => update({ date_range: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last_30_days">Last 30 days</SelectItem>
                                    <SelectItem value="last_90_days">Last 90 days</SelectItem>
                                    <SelectItem value="last_12_months">Last 12 months</SelectItem>
                                    <SelectItem value="all">All available data</SelectItem>
                                </SelectContent>
                            </Select>
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            Show results
                            <Select value={filters.show} onValueChange={(value) => update({ show: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="top_5">Top 5</SelectItem>
                                    <SelectItem value="top_10">Top 10</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </label>
                        {filters.type === 'keywords' ? (
                            <label className="space-y-2 text-sm font-medium">
                                Search term
                                <Input
                                    value={filters.term}
                                    maxLength={255}
                                    placeholder="Filter terms"
                                    onChange={(event) => update({ term: event.target.value })}
                                />
                            </label>
                        ) : (
                            <label className="space-y-2 text-sm font-medium">
                                Program
                                <Select value={filters.program} onValueChange={(value) => update({ program: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All programs</SelectItem>
                                        {programs.map((program) => (
                                            <SelectItem key={program.id} value={String(program.id)}>
                                                {program.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {filters.type === 'keywords'
                            ? 'Search terms are aggregated; no user-level data is shown.'
                            : 'Signed-in activity only. Guest and anonymous accesses are excluded.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void apply()} disabled={loading}>
                            {loading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Apply filters
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setFilters({ ...defaults, type: filters.type });
                                setResult(null);
                                setAppliedFilters(null);
                                setError('');
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {!result && !loading && !error && <p className="text-sm text-muted-foreground">Apply filters to view usage report results.</p>}
            {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading usage events…
                </div>
            )}
            {error && (
                <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            {result && appliedFilters && (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <ReportResultsActions
                            title={`Results (${result.totalRecords} records)`}
                            description="Usage report results"
                            disabled={!appliedFilters}
                            isExporting={isExporting}
                            formats={['pdf', 'docx']}
                            onPreview={() => void preview()}
                            onExport={(format) => void exportReport(format)}
                        />
                        <p className="text-sm text-muted-foreground">Usage totals here reflect activity recorded from this point forward.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {summaries.map(([label, value]) => (
                            <Card key={label}>
                                <CardHeader className="pb-2">
                                    <CardDescription>{label}</CardDescription>
                                    <CardTitle className="text-2xl">{value ?? 0}</CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Breakdown</CardTitle>
                            <CardDescription>
                                {result.type === 'keywords'
                                    ? 'Search counts and share of filtered searches.'
                                    : 'Authenticated research access counts. Viewer totals are aggregated.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {result.items.length === 0 ? (
                                <p className="py-4 text-sm text-muted-foreground">No usage events match these filters.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {result.type === 'keywords' ? (
                                                <>
                                                    <TableHead>Search term</TableHead>
                                                    <TableHead className="text-right">Searches</TableHead>
                                                    <TableHead className="text-right">Share</TableHead>
                                                </>
                                            ) : (
                                                <>
                                                    <TableHead>Research title</TableHead>
                                                    <TableHead>Program</TableHead>
                                                    <TableHead className="text-right">Accesses</TableHead>
                                                    <TableHead className="text-right">Distinct signed-in viewers</TableHead>
                                                </>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {result.items.map((entry) =>
                                            result.type === 'keywords' ? (
                                                <TableRow key={(entry as KeywordRow).term}>
                                                    <TableCell>{(entry as KeywordRow).term}</TableCell>
                                                    <TableCell className="text-right">{(entry as KeywordRow).searches}</TableCell>
                                                    <TableCell>
                                                        <div className="flex min-w-40 items-center gap-3">
                                                            <span className="h-2 min-w-12 flex-1 overflow-hidden rounded-full bg-muted">
                                                                <span
                                                                    className="block h-full rounded-full bg-primary"
                                                                    style={{ width: `${Math.min(100, (entry as KeywordRow).share)}%` }}
                                                                />
                                                            </span>
                                                            <span className="w-14 shrink-0 text-right tabular-nums">
                                                                {(entry as KeywordRow).share}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                <TableRow key={(entry as AccessRow).researchId}>
                                                    <TableCell>
                                                        <button
                                                            type="button"
                                                            className="text-left text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                            onClick={() => setActiveResearchId((entry as AccessRow).researchId)}
                                                        >
                                                            {(entry as AccessRow).title}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell>{(entry as AccessRow).program}</TableCell>
                                                    <TableCell className="text-right">{(entry as AccessRow).accesses}</TableCell>
                                                    <TableCell className="text-right">{(entry as AccessRow).viewers}</TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <ReportPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} title="Usage Report Preview" previewUrl={previewFileUrl} />
            <ResearchDetailsModal
                id={activeResearchId}
                onClose={() => setActiveResearchId(null)}
                detailsUrl="/admin/reports/usage-research"
                loadErrorMessage="Unable to load this research"
                networkErrorMessage="Unable to load this research"
                allowBackdropClose
            />
        </div>
    );
}
