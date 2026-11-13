import ReportPreviewModal from '@/components/modals/report-preview-modal';
import ReportResultsActions from '@/components/reports/report-results-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatName } from '@/lib/report-format';
import type { ReportCardProps, Research } from '@/types/reports';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

type ColumnId = 'title' | 'abstract' | 'program' | 'completed_year' | 'adviser' | 'status' | 'researchers' | 'panelists' | 'keywords' | 'alignment';
type AlignmentCategory = 'all' | 'any' | 'sdg' | 'srig' | 'agenda';

const columnLabels: Record<ColumnId, string> = {
    title: 'Title',
    abstract: 'Abstract',
    program: 'Program',
    completed_year: 'Completed Year',
    adviser: 'Adviser',
    status: 'Status',
    researchers: 'Researchers',
    panelists: 'Panelists',
    keywords: 'Keywords',
    alignment: 'Alignment',
};

const columnGroups: Array<{ label: string; columns: ColumnId[] }> = [
    { label: 'Research', columns: ['title', 'abstract', 'completed_year', 'status'] },
    { label: 'People and Program', columns: ['program', 'adviser', 'researchers', 'panelists'] },
    { label: 'Research Metadata', columns: ['keywords'] },
];

export default function MatrixReportCard({ records, programs, years, advisers, panelists, statuses, filters }: ReportCardProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [program, setProgram] = useState(filters.program?.toString() || 'all');
    const [year, setYear] = useState(filters.year?.toString() || 'all');
    const [adviser, setAdviser] = useState(filters.adviser?.toString() || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [researcher, setResearcher] = useState('all');
    const [panelist, setPanelist] = useState('all');
    const [keyword, setKeyword] = useState('all');
    const [alignmentCategory, setAlignmentCategory] = useState<AlignmentCategory>('all');
    const [selectedAlignmentTypes, setSelectedAlignmentTypes] = useState<string[]>([]);
    const [alignmentTypeMenuOpen, setAlignmentTypeMenuOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState<ColumnId[]>([]);
    const [filtered, setFiltered] = useState<Research[]>([]);
    const [selectionError, setSelectionError] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const unique = <T,>(values: T[], key: (value: T) => string | number = (value) => String(value)) =>
        Array.from(new Map(values.map((value) => [key(value), value])).values());
    const researcherOptions = unique(
        records.flatMap((record) => record.researchers ?? []),
        (value) => value.id,
    ).sort((a, b) => formatName(a).localeCompare(formatName(b)));
    const panelistOptions = [
        ...(panelists ??
            unique(
                records.flatMap((record) => record.panelists ?? []),
                (value) => value.id,
            )),
    ].sort((a, b) => formatName(a).localeCompare(formatName(b)));
    const keywordOptions = unique(
        records.flatMap((record) => record.keywords ?? []),
        (value) => value.id,
    ).sort((a, b) => a.keyword_name.localeCompare(b.keyword_name));
    const alignmentGroups = [
        {
            category: 'sdg',
            label: 'SDG',
            items: unique(
                records.flatMap((record) => record.sdgs ?? []),
                (value) => value.id,
            ),
        },
        {
            category: 'srig',
            label: 'SRIG',
            items: unique(
                records.flatMap((record) => record.srigs ?? []),
                (value) => value.id,
            ),
        },
        {
            category: 'agenda',
            label: 'Agenda',
            items: unique(
                records.flatMap((record) => record.agendas ?? []),
                (value) => value.id,
            ),
        },
    ].map((group) => ({ ...group, items: group.items.sort((a, b) => a.name.localeCompare(b.name)) }));
    const visibleAlignmentGroups =
        alignmentCategory === 'all'
            ? alignmentGroups
            : alignmentCategory === 'any'
              ? alignmentGroups
              : alignmentGroups.filter((group) => group.category === alignmentCategory);
    const alignmentKey = (category: string, id: number) => `${category}:${id}`;
    const allAlignmentKeys = alignmentGroups.flatMap((group) => group.items.map((item) => alignmentKey(group.category, item.id)));
    const activeAlignmentTypes = alignmentCategory === 'all' ? allAlignmentKeys : selectedAlignmentTypes;

    const filterValues = { program, year, adviser, status, researcher, panelist, keyword };

    const filterRecords = (overrides: Partial<typeof filterValues> = {}) => {
        const values = { ...filterValues, ...overrides };
        let result = [...records];
        if (values.program !== 'all') result = result.filter((record) => record.program?.id.toString() === values.program);
        if (values.year !== 'all') result = result.filter((record) => record.completed_year?.toString() === values.year);
        if (values.adviser !== 'all') result = result.filter((record) => record.adviser?.id.toString() === values.adviser);
        if (values.status !== 'all') result = result.filter((record) => record.status === values.status);
        if (values.researcher !== 'all')
            result = result.filter((record) => record.researchers?.some((person) => person.id.toString() === values.researcher));
        if (values.panelist !== 'all')
            result = result.filter((record) => record.panelists?.some((person) => person.id.toString() === values.panelist));
        if (values.keyword !== 'all') result = result.filter((record) => record.keywords?.some((item) => item.id.toString() === values.keyword));
        if (activeAlignmentTypes.length > 0) {
            result = result.filter((record) =>
                activeAlignmentTypes.some((selection) => {
                    const [category, id] = selection.split(':');
                    if (category === 'sdg') return record.sdgs?.some((item) => item.id.toString() === id);
                    if (category === 'srig') return record.srigs?.some((item) => item.id.toString() === id);
                    return record.agendas?.some((item) => item.id.toString() === id);
                }),
            );
        }
        return result.sort((a, b) => (a.completed_year ?? 0) - (b.completed_year ?? 0) || (a.completed_month ?? 0) - (b.completed_month ?? 0));
    };

    const columnsForFilters = (values = filterValues): ColumnId[] => {
        const columns: ColumnId[] = [];
        if (values.program !== 'all') columns.push('program');
        if (values.year !== 'all') columns.push('completed_year');
        if (values.adviser !== 'all') columns.push('adviser');
        if (values.status !== 'all') columns.push('status');
        if (values.researcher !== 'all') columns.push('researchers');
        if (values.panelist !== 'all') columns.push('panelists');
        if (values.keyword !== 'all') columns.push('keywords');
        if (activeAlignmentTypes.length > 0) columns.push('alignment');
        return columns;
    };

    const orderedSelectedColumns = [...columnGroups.flatMap((group) => group.columns), 'alignment' as ColumnId].filter((column) =>
        selectedColumns.includes(column),
    );

    const goToColumns = () => {
        setFiltered(filterRecords());
        setSelectedColumns(columnsForFilters());
        setSelectionError('');
        setStep(2);
    };

    const reset = () => {
        setProgram('all');
        setYear('all');
        setAdviser('all');
        setStatus('all');
        setResearcher('all');
        setPanelist('all');
        setKeyword('all');
        setAlignmentCategory('all');
        setSelectedAlignmentTypes([]);
        setSelectedColumns([]);
        setFiltered([]);
        setSelectionError('');
        setStep(1);
    };

    const toggleColumn = (column: ColumnId, checked: boolean | 'indeterminate') => {
        setSelectedColumns((current) => (checked === true ? [...current, column] : current.filter((value) => value !== column)));
        setSelectionError('');
    };

    const handleAlignmentCategoryChange = (value: string) => {
        const category = value as AlignmentCategory;
        setAlignmentCategory(category);
        if (category === 'all') {
            setSelectedAlignmentTypes(allAlignmentKeys);
        } else {
            setSelectedAlignmentTypes([]);
        }
    };

    const alignmentValue = (research: Research) => {
        const values = [
            ...alignmentGroups.flatMap((group) =>
                group.items
                    .filter((item) => !activeAlignmentTypes.length || activeAlignmentTypes.includes(alignmentKey(group.category, item.id)))
                    .filter((item) =>
                        research[`${group.category}s` as 'sdgs' | 'srigs' | 'agendas']?.some((researchItem) => researchItem.id === item.id),
                    )
                    .map((item) => `${group.label}: ${item.name}`),
            ),
        ];
        return values.length ? values.join(', ') : 'None';
    };

    const columnValue = (research: Research, column: ColumnId) => {
        switch (column) {
            case 'title':
                return research.research_title;
            case 'abstract':
                return research.research_abstract || 'N/A';
            case 'program':
                return research.program?.name || 'N/A';
            case 'completed_year':
                return research.completed_year || 'N/A';
            case 'adviser':
                return formatName(research.adviser);
            case 'status':
                return research.status || 'N/A';
            case 'researchers':
                return research.researchers?.map(formatName).join(', ') || 'N/A';
            case 'panelists':
                return research.panelists?.map(formatName).join(', ') || 'N/A';
            case 'keywords':
                return research.keywords?.map((item) => item.keyword_name).join(', ') || 'None';
            case 'alignment':
                return alignmentValue(research);
        }
    };

    const buildParams = (extra?: Record<string, string>) => {
        const params = new URLSearchParams();
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value !== 'all') params.append(key, value);
        });
        orderedSelectedColumns.forEach((column) => params.append('columns[]', column));
        params.append('alignment_category', alignmentCategory);
        activeAlignmentTypes.forEach((selection) => params.append('alignment_selections[]', selection));
        if (extra) Object.entries(extra).forEach(([key, value]) => params.append(key, value));
        return params;
    };

    const apiPrefix = () => (window.location.pathname.includes('/admin') ? '/admin' : '/staff');
    const preview = () => {
        if (!selectedColumns.length) {
            setSelectionError('Select at least one column to continue.');
            return;
        }
        setPreviewUrl(`${apiPrefix()}/reports/export-matrix?${buildParams({ format: 'pdf', preview: '1' }).toString()}`);
        setPreviewOpen(true);
    };
    const exportReport = (format: 'pdf' | 'docx' | 'excel') => {
        if (!selectedColumns.length) {
            setSelectionError('Select at least one column to continue.');
            return;
        }
        setIsExporting(true);
        window.location.href = `${apiPrefix()}/reports/export-matrix?${buildParams({ format }).toString()}`;
        setTimeout(() => setIsExporting(false), 3000);
    };

    const selector = (
        id: string,
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: Array<{ value: string; label: string }>,
    ) => (
        <Card key={id}>
            <CardContent className="space-y-2 p-4">
                <label htmlFor={id} className="text-sm font-medium">
                    {label}
                </label>
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger id={id}>
                        <SelectValue placeholder={`All ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All {label}</SelectItem>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Research Matrix Generator</CardTitle>
                    <CardDescription>Filter records, choose matrix columns, preview the result, and export it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-2 text-sm">
                        {['Filter', 'Select columns and preview'].map((label, index) => (
                            <div
                                key={label}
                                className={`rounded-md px-3 py-2 ${step === index + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                            >
                                {index + 1}. {label}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {selector(
                                    'matrix-program',
                                    'Program',
                                    program,
                                    setProgram,
                                    programs.map((item) => ({ value: item.id.toString(), label: item.name })),
                                )}
                                {selector(
                                    'matrix-year',
                                    'Year',
                                    year,
                                    setYear,
                                    years.map((item) => ({ value: item.toString(), label: item.toString() })),
                                )}
                                {selector(
                                    'matrix-adviser',
                                    'Adviser',
                                    adviser,
                                    setAdviser,
                                    advisers.map((item) => ({ value: item.id.toString(), label: formatName(item) })),
                                )}
                                {selector(
                                    'matrix-researcher',
                                    'Researcher',
                                    researcher,
                                    setResearcher,
                                    unique(
                                        records.flatMap((record) => record.researchers ?? []),
                                        (value) => value.id,
                                    ).map((item) => ({ value: item.id.toString(), label: formatName(item) })),
                                )}
                                {selector(
                                    'matrix-panelist',
                                    'Panelist',
                                    panelist,
                                    setPanelist,
                                    panelistOptions.map((item) => ({ value: item.id.toString(), label: formatName(item) })),
                                )}
                                {selector(
                                    'matrix-keyword',
                                    'Keyword',
                                    keyword,
                                    setKeyword,
                                    keywordOptions.map((item) => ({ value: item.id.toString(), label: item.keyword_name })),
                                )}
                                {selector(
                                    'matrix-status',
                                    'Status',
                                    status,
                                    setStatus,
                                    statuses.map((item) => ({ value: item, label: item })),
                                )}
                                <Card>
                                    <CardContent className="space-y-2 p-4">
                                        <label htmlFor="matrix-alignment-category" className="text-sm font-medium">
                                            Alignment Category
                                        </label>
                                        <Select value={alignmentCategory} onValueChange={handleAlignmentCategoryChange}>
                                            <SelectTrigger id="matrix-alignment-category">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Alignment Categories</SelectItem>
                                                <SelectItem value="any">Any Alignment Category</SelectItem>
                                                <SelectItem value="sdg">SDG</SelectItem>
                                                <SelectItem value="srig">SRIG</SelectItem>
                                                <SelectItem value="agenda">Agenda</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="space-y-2 p-4">
                                        <p className="text-sm font-medium">Alignment Type</p>
                                        <DropdownMenu open={alignmentTypeMenuOpen} onOpenChange={setAlignmentTypeMenuOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between font-normal">
                                                    {alignmentCategory === 'all'
                                                        ? 'All alignment types'
                                                        : activeAlignmentTypes.length
                                                          ? `${activeAlignmentTypes.length} alignment type${activeAlignmentTypes.length === 1 ? '' : 's'} selected`
                                                          : 'Select alignment types'}
                                                    <ChevronDown className="ml-2 h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="max-h-80 w-72 overflow-y-auto">
                                                {visibleAlignmentGroups.map((group) => (
                                                    <div key={group.category}>
                                                        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                                            {group.label}
                                                        </p>
                                                        {group.items.map((alignment) => (
                                                            <DropdownMenuCheckboxItem
                                                                key={alignment.id}
                                                                checked={activeAlignmentTypes.includes(alignmentKey(group.category, alignment.id))}
                                                                disabled={alignmentCategory === 'all'}
                                                                onSelect={(event) => event.preventDefault()}
                                                                onCheckedChange={(checked) =>
                                                                    setSelectedAlignmentTypes((current) =>
                                                                        checked === true
                                                                            ? current.includes(alignmentKey(group.category, alignment.id))
                                                                                ? current
                                                                                : [...current, alignmentKey(group.category, alignment.id)]
                                                                            : current.filter(
                                                                                  (value) => value !== alignmentKey(group.category, alignment.id),
                                                                              ),
                                                                    )
                                                                }
                                                            >
                                                                {alignment.name}
                                                            </DropdownMenuCheckboxItem>
                                                        ))}
                                                    </div>
                                                ))}
                                                {visibleAlignmentGroups.length === 0 && (
                                                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                                        Choose a category to see its alignment types.
                                                    </p>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={goToColumns}>Next: Select Columns</Button>
                                {(step !== 1 ||
                                    filtered.length ||
                                    selectedColumns.length ||
                                    Object.values(filterValues).some((value) => value !== 'all')) && (
                                    <Button onClick={reset} variant="outline">
                                        <X className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="font-semibold">Select Columns</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fields used in Step 1 are selected automatically. Add or remove columns as needed.
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {columnGroups.map((group) => (
                                    <Card key={group.label}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{group.label}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {group.columns.map((column) => (
                                                <label key={column} className="flex items-center gap-2 text-sm">
                                                    <Checkbox
                                                        checked={selectedColumns.includes(column)}
                                                        onCheckedChange={(checked) => toggleColumn(column, checked)}
                                                    />
                                                    {columnLabels[column]}
                                                </label>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <Card className="md:col-span-3">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Selected Alignment Types</CardTitle>
                                    <CardDescription>Alignment types selected in Step 1, organized by category.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {activeAlignmentTypes.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-3">
                                            {visibleAlignmentGroups.map((group) => (
                                                <div key={group.category} className="space-y-2">
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase">{group.label}</p>
                                                    {group.items
                                                        .filter((item) => activeAlignmentTypes.includes(alignmentKey(group.category, item.id)))
                                                        .map((item) => (
                                                            <label key={item.id} className="flex items-center gap-2 text-sm">
                                                                <Checkbox
                                                                    checked
                                                                    disabled={alignmentCategory === 'all'}
                                                                    onCheckedChange={(checked) =>
                                                                        setSelectedAlignmentTypes((current) =>
                                                                            checked === true
                                                                                ? current.includes(alignmentKey(group.category, item.id))
                                                                                    ? current
                                                                                    : [...current, alignmentKey(group.category, item.id)]
                                                                                : current.filter(
                                                                                      (value) => value !== alignmentKey(group.category, item.id),
                                                                                  ),
                                                                        )
                                                                    }
                                                                />
                                                                {item.name}
                                                            </label>
                                                        ))}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No alignment types selected in Step 1.</p>
                                    )}
                                </CardContent>
                            </Card>
                            <div className="flex gap-2">
                                <Button onClick={() => setStep(1)} variant="outline">
                                    Back to Filters
                                </Button>
                                <Button onClick={reset} variant="ghost">
                                    Reset
                                </Button>
                            </div>
                            <div className="space-y-4">
                                <ReportResultsActions
                                    title="Table Preview"
                                    description={`${filtered.length} records`}
                                    disabled={!selectedColumns.length || !filtered.length}
                                    isExporting={isExporting}
                                    onPreview={preview}
                                    onExport={exportReport}
                                />
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {orderedSelectedColumns.map((column) => (
                                                    <TableHead key={column}>{columnLabels[column]}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filtered.map((research) => (
                                                <TableRow key={research.id}>
                                                    {orderedSelectedColumns.map((column) => (
                                                        <TableCell key={column} className="text-sm">
                                                            {columnValue(research, column)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            {selectionError && <p className="text-sm text-destructive">{selectionError}</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
            <ReportPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} title="Matrix Report Preview" previewUrl={previewUrl} />
        </>
    );
}
