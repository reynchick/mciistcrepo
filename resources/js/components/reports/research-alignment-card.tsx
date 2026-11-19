import ReportPreviewModal from '@/components/modals/report-preview-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatName } from '@/lib/report-format';
import type { AlignmentCategory, ReportCardProps, Research } from '@/types/reports';
import { ChevronDown, Download, Eye, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

type AlignmentGroup = {
    category: Exclude<AlignmentCategory, 'all' | 'any'>;
    label: string;
    relation: 'sdgs' | 'srigs' | 'agendas';
    items: Array<{ id: number; name: string }>;
};

type Props = Pick<ReportCardProps, 'records' | 'programs' | 'years' | 'advisers' | 'statuses' | 'filters'>;

export default function ResearchAlignmentCard({ records, programs, years, advisers, statuses, filters }: Props) {
    const [year, setYear] = useState(filters.year?.toString() || 'all');
    const [program, setProgram] = useState(filters.program?.toString() || 'all');
    const [adviser, setAdviser] = useState(filters.adviser?.toString() || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [alignmentCategory, setAlignmentCategory] = useState<AlignmentCategory>('all');
    const [selectedAlignmentTypes, setSelectedAlignmentTypes] = useState<string[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const unique = <T,>(values: T[], key: (value: T) => string | number) => Array.from(new Map(values.map((value) => [key(value), value])).values());

    const alignmentGroups = useMemo<AlignmentGroup[]>(() => {
        const groups: AlignmentGroup[] = [
            {
                category: 'sdg',
                label: 'SDG',
                relation: 'sdgs',
                items: unique(
                    records.flatMap((record) => record.sdgs ?? []),
                    (item) => item.id,
                ),
            },
            {
                category: 'srig',
                label: 'SRIG',
                relation: 'srigs',
                items: unique(
                    records.flatMap((record) => record.srigs ?? []),
                    (item) => item.id,
                ),
            },
            {
                category: 'agenda',
                label: 'Agenda',
                relation: 'agendas',
                items: unique(
                    records.flatMap((record) => record.agendas ?? []),
                    (item) => item.id,
                ),
            },
        ];

        return groups.map((group) => ({
            ...group,
            items: group.items.sort((a, b) => a.name.localeCompare(b.name)),
        }));
    }, [records]);

    const alignmentKey = (category: AlignmentGroup['category'], id: number) => `${category}:${id}`;
    const allAlignmentKeys = alignmentGroups.flatMap((group) => group.items.map((item) => alignmentKey(group.category, item.id)));
    const visibleGroups =
        alignmentCategory === 'all' || alignmentCategory === 'any'
            ? alignmentGroups
            : alignmentGroups.filter((group) => group.category === alignmentCategory);
    const activeAlignmentTypes = alignmentCategory === 'all' ? allAlignmentKeys : selectedAlignmentTypes;

    const filteredRecords = useMemo(() => {
        return records.filter((record) => {
            if (program !== 'all' && record.program?.id.toString() !== program) return false;
            if (year !== 'all' && record.completed_year?.toString() !== year) return false;
            if (adviser !== 'all' && record.adviser?.id.toString() !== adviser) return false;
            if (status !== 'all' && record.status !== status) return false;

            const groupsToMatch =
                alignmentCategory === 'all' || alignmentCategory === 'any'
                    ? alignmentGroups
                    : alignmentGroups.filter((group) => group.category === alignmentCategory);

            if (alignmentCategory !== 'all' && !groupsToMatch.some((group) => (record[group.relation] ?? []).length > 0)) {
                return false;
            }

            if (
                selectedAlignmentTypes.length > 0 &&
                !selectedAlignmentTypes.some((selection) => {
                    const [category, id] = selection.split(':');
                    const group = alignmentGroups.find((item) => item.category === category);
                    return group !== undefined && record[group.relation]?.some((item) => item.id.toString() === id);
                })
            ) {
                return false;
            }

            return true;
        });
    }, [records, program, year, adviser, status, alignmentCategory, alignmentGroups, selectedAlignmentTypes]);

    const handleCategoryChange = (value: string) => {
        setAlignmentCategory(value as AlignmentCategory);
        setSelectedAlignmentTypes([]);
    };

    const reset = () => {
        setYear('all');
        setProgram('all');
        setAdviser('all');
        setStatus('all');
        setAlignmentCategory('all');
        setSelectedAlignmentTypes([]);
    };

    const alignmentValue = (research: Research) => {
        const groups =
            alignmentCategory === 'all' || alignmentCategory === 'any'
                ? alignmentGroups
                : alignmentGroups.filter((group) => group.category === alignmentCategory);

        const values = groups.flatMap((group) =>
            (research[group.relation] ?? [])
                .filter((item) => selectedAlignmentTypes.length === 0 || selectedAlignmentTypes.includes(alignmentKey(group.category, item.id)))
                .map((item) => `${group.label}: ${item.name}`),
        );

        return values.length > 0 ? values.join(', ') : 'None';
    };

    const reportAlignmentSelections = () => {
        if (alignmentCategory === 'all') return [];
        if (selectedAlignmentTypes.length > 0) return selectedAlignmentTypes;

        const groups = alignmentCategory === 'any' ? alignmentGroups : alignmentGroups.filter((group) => group.category === alignmentCategory);

        return groups.flatMap((group) => group.items.map((item) => alignmentKey(group.category, item.id)));
    };

    const reportUrl = (format: 'pdf' | 'docx' | 'excel', preview = false) => {
        const params = new URLSearchParams();
        if (program !== 'all') params.set('program', program);
        if (year !== 'all') params.set('year', year);
        if (adviser !== 'all') params.set('adviser', adviser);
        if (status !== 'all') params.set('status', status);
        ['title', 'program', 'completed_year', 'adviser', 'status', 'alignment'].forEach((column) => params.append('columns[]', column));
        params.set('alignment_category', alignmentCategory);
        reportAlignmentSelections().forEach((selection) => params.append('alignment_selections[]', selection));
        params.set('format', format);
        if (preview) params.set('preview', '1');

        const prefix = window.location.pathname.includes('/admin') ? '/admin' : '/staff';
        return `${prefix}/reports/export-matrix?${params.toString()}`;
    };

    const previewReport = () => {
        setPreviewUrl(reportUrl('pdf', true));
        setPreviewOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Research Alignment Report</CardTitle>
                    <CardDescription>
                        Filter research records by alignment and research details. {filteredRecords.length} matching record(s).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <FilterSelect label="Alignment Category" value={alignmentCategory} onChange={handleCategoryChange}>
                            <SelectItem value="any">Any Alignment Category</SelectItem>
                            <SelectItem value="sdg">SDG</SelectItem>
                            <SelectItem value="srig">SRIG</SelectItem>
                            <SelectItem value="agenda">Agenda</SelectItem>
                        </FilterSelect>
                        <Card>
                            <CardContent className="space-y-2 p-4">
                                <p className="text-sm font-medium">Alignment Type</p>
                                <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between font-normal">
                                            {alignmentCategory === 'all'
                                                ? 'All alignment types'
                                                : activeAlignmentTypes.length > 0
                                                  ? `${activeAlignmentTypes.length} alignment type${activeAlignmentTypes.length === 1 ? '' : 's'} selected`
                                                  : 'Any alignment type'}
                                            <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
                                        {visibleGroups.map((group) => (
                                            <div key={group.category}>
                                                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">{group.label}</p>
                                                {group.items.map((item) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={item.id}
                                                        checked={activeAlignmentTypes.includes(alignmentKey(group.category, item.id))}
                                                        disabled={alignmentCategory === 'all'}
                                                        onSelect={(event) => event.preventDefault()}
                                                        onCheckedChange={(checked) =>
                                                            setSelectedAlignmentTypes((current) =>
                                                                checked === true
                                                                    ? [...new Set([...current, alignmentKey(group.category, item.id)])]
                                                                    : current.filter((value) => value !== alignmentKey(group.category, item.id)),
                                                            )
                                                        }
                                                    >
                                                        {item.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </div>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardContent>
                        </Card>
                        <FilterSelect label="Completed Year" value={year} onChange={setYear}>
                            {years.map((item) => (
                                <SelectItem key={item} value={item.toString()}>
                                    {item}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                        <FilterSelect label="Program" value={program} onChange={setProgram}>
                            {programs.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                        <FilterSelect label="Adviser" value={adviser} onChange={setAdviser}>
                            {advisers.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                    {formatName(item)}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                        <FilterSelect label="Status" value={status} onChange={setStatus}>
                            {statuses.map((item) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </FilterSelect>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2">
                        <Button variant="outline" onClick={reset}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={previewReport} disabled={filteredRecords.length === 0}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview PDF
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button disabled={filteredRecords.length === 0}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {(['pdf', 'docx', 'excel'] as const).map((format) => (
                                        <DropdownMenuItem key={format} asChild>
                                            <a href={reportUrl(format)}>{format.toUpperCase()}</a>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Completed Year</TableHead>
                                    <TableHead>Adviser</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Alignment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.length > 0 ? (
                                    filteredRecords.map((research) => (
                                        <TableRow key={research.id}>
                                            <TableCell>{research.research_title}</TableCell>
                                            <TableCell>{research.program?.name ?? 'N/A'}</TableCell>
                                            <TableCell>{research.completed_year ?? 'N/A'}</TableCell>
                                            <TableCell>{formatName(research.adviser)}</TableCell>
                                            <TableCell>{research.status ?? 'N/A'}</TableCell>
                                            <TableCell>{alignmentValue(research)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No research records match these filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <ReportPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} title="Research Alignment Report Preview" previewUrl={previewUrl} />
        </>
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
        <Card>
            <CardContent className="space-y-2 p-4">
                <p className="text-sm font-medium">{label}</p>
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger aria-label={label}>
                        <SelectValue placeholder={`All ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All {label}</SelectItem>
                        {children}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
}
