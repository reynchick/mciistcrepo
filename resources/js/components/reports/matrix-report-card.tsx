import ReportPreviewModal from '@/components/modals/report-preview-modal';
import ReportResultsActions from '@/components/reports/report-results-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Stepper from '@/components/ui/stepper';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatName } from '@/lib/report-format';
import type { ReportCardProps, Research } from '@/types/reports';
import { ChevronDown, X } from 'lucide-react';
import { useState } from 'react';


type ColumnId = 'title' | 'abstract' | 'program' | 'completed_year' | 'adviser' | 'status' | 'researchers' | 'panelists' | 'keywords';
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
};

const MATRIX_STEPS = [{ label: 'Filter' }, { label: 'Select columns and preview' }];

const columnGroups: Array<{ label: string; columns: ColumnId[] }> = [
    { label: 'Research', columns: ['title', 'abstract', 'completed_year', 'status'] },
    { label: 'People and Program', columns: ['program', 'adviser', 'researchers', 'panelists'] },
    { label: 'Research Metadata', columns: ['keywords'] },
];

export default function MatrixReportCard({ records, programs, years, advisers, panelists, statuses, filters }: ReportCardProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const asValues = (value: string | number | undefined) =>
        value === undefined || value === null || value === '' || value === 'all' ? [] : [value.toString()];
    const [program, setProgram] = useState<string[]>(asValues(filters.program));
    const [year, setYear] = useState<string[]>(asValues(filters.year));
    const [adviser, setAdviser] = useState<string[]>(asValues(filters.adviser));
    const [status, setStatus] = useState<string[]>(asValues(filters.status));
    const [panelist, setPanelist] = useState<string[]>([]);
    const [keyword, setKeyword] = useState<string[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<ColumnId[]>([]);
    const [filtered, setFiltered] = useState<Research[]>([]);
    const [selectionError, setSelectionError] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    const unique = <T,>(values: T[], key: (value: T) => string | number = (value) => String(value)) =>
        Array.from(new Map(values.map((value) => [key(value), value])).values());
    const filterValues = { program, year, adviser, status, panelist, keyword };

    const filterRecords = (overrides: Partial<typeof filterValues> = {}) => {
        const values = { ...filterValues, ...overrides };
        let result = [...records];
        if (values.program.length) result = result.filter((record) => record.program && values.program.includes(record.program.id.toString()));
        if (values.year.length) result = result.filter((record) => record.completed_year && values.year.includes(record.completed_year.toString()));
        if (values.adviser.length) result = result.filter((record) => record.adviser && values.adviser.includes(record.adviser.id.toString()));
        if (values.status.length) result = result.filter((record) => record.status && values.status.includes(record.status));
        if (values.panelist.length)
            result = result.filter((record) => record.panelists?.some((person) => values.panelist.includes(person.id.toString())));
        if (values.keyword.length) result = result.filter((record) => record.keywords?.some((item) => values.keyword.includes(item.id.toString())));
        return result.sort((a, b) => (a.completed_year ?? 0) - (b.completed_year ?? 0) || (a.completed_month ?? 0) - (b.completed_month ?? 0));
    };

    type FilterKey = keyof typeof filterValues;

    const handleFilterChange = (key: FilterKey, values: string[]) => {
        const nextValues = { ...filterValues, [key]: values };
        const setters: Record<FilterKey, (values: string[]) => void> = {
            program: setProgram,
            year: setYear,
            adviser: setAdviser,
            status: setStatus,
            panelist: setPanelist,
            keyword: setKeyword,
        };

        setters[key](values);

        (Object.keys(nextValues) as FilterKey[]).forEach((otherKey) => {
            if (otherKey === key) return;

            const available = filterRecords({ ...nextValues, [otherKey]: [] });
            let validValues: string[] = [];

            if (otherKey === 'program') {
                validValues = unique(available.flatMap((record) => (record.program ? [record.program] : [])), (item) => item.id).map((item) =>
                    item.id.toString(),
                );
            } else if (otherKey === 'year') {
                validValues = unique(available.flatMap((record) => (record.completed_year ? [record.completed_year] : []))).map((item) =>
                    item.toString(),
                );
            } else if (otherKey === 'adviser') {
                validValues = unique(available.flatMap((record) => (record.adviser ? [record.adviser] : [])), (item) => item.id).map((item) =>
                    item.id.toString(),
                );
            } else if (otherKey === 'panelist') {
                validValues = unique(available.flatMap((record) => record.panelists ?? []), (item) => item.id).map((item) =>
                    item.id.toString(),
                );
            } else if (otherKey === 'keyword') {
                validValues = unique(available.flatMap((record) => record.keywords ?? []), (item) => item.id).map((item) =>
                    item.id.toString(),
                );
            } else {
                validValues = unique(available.flatMap((record) => (record.status ? [record.status] : [])));
            }

            const prunedValues = nextValues[otherKey].filter((value) => validValues.includes(value));
            if (prunedValues.length !== nextValues[otherKey].length) {
                setters[otherKey](prunedValues);
            }
        });
    };

    const availableFor = (key: FilterKey) => filterRecords({ [key]: [] });

    const columnsForFilters = (values = filterValues): ColumnId[] => {
        const columns: ColumnId[] = [];
        if (values.program.length) columns.push('program');
        if (values.year.length) columns.push('completed_year');
        if (values.adviser.length) columns.push('adviser');
        if (values.status.length) columns.push('status');
        if (values.panelist.length) columns.push('panelists');
        if (values.keyword.length) columns.push('keywords');
        return columns;
    };

    const orderedSelectedColumns = [...columnGroups.flatMap((group) => group.columns)].filter((column) =>
        selectedColumns.includes(column),
    );

    const goToColumns = () => {
        setFiltered(filterRecords());
        setSelectedColumns(columnsForFilters());
        setSelectionError('');
        setStep(2);
    };

    const resetFilters = () => {
        setProgram([]);
        setYear([]);
        setAdviser([]);
        setStatus([]);
        setPanelist([]);
        setKeyword([]);
        setSelectedColumns([]);
        setFiltered([]);
        setSelectionError('');
        setStep(1);
    };

    const resetColumns = () => {
        setSelectedColumns(columnsForFilters());
        setSelectionError('');
    };

    const toggleColumn = (column: ColumnId, checked: boolean | 'indeterminate') => {
        setSelectedColumns((current) => (checked === true ? [...current, column] : current.filter((value) => value !== column)));
        setSelectionError('');
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
        }
    };

    const buildParams = (extra?: Record<string, string>) => {
        const params = new URLSearchParams();
        Object.entries(filterValues).forEach(([key, values]) => {
            values.forEach((value) => params.append(`${key}[]`, value));
        });
        orderedSelectedColumns.forEach((column) => params.append('columns[]', column));
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
    value: string[],
    onChange: (values: string[]) => void,
    options: Array<{ value: string; label: string }>,
) => {
    const allLabels: Record<string, string> = {
        Program: 'All Programs',
        Year: 'All Years',
        Adviser: 'All Advisers',
        Panelist: 'All Panelists',
        Keyword: 'All Keywords',
        Status: 'All Statuses',
    };

    return (
        <div key={id} className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium">
                {label}
            </label>

            <Select
                value={value[0] || 'all'}
                onValueChange={(selected) =>
                    onChange(selected === 'all' ? [] : [selected])
                }
            >
                <SelectTrigger id={id}>
                    <SelectValue placeholder={allLabels[label]} />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem value="all">{allLabels[label]}</SelectItem>

                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
    return (
        <>
            <Card className="border-[0.2px] border-slate-200 shadow-none dark:border-slate-700">
                <CardHeader>
                    <CardTitle>Research Matrix Generator</CardTitle>
                    <CardDescription>Filter records, choose matrix columns, preview the result, and export it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Stepper steps={MATRIX_STEPS} currentStep={step - 1} className="mx-auto max-w-lg" />

                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {selector(
                                    'matrix-program',
                                    'Program',
                                    program,
                                    (values) => handleFilterChange('program', values),
                                    unique(
                                        availableFor('program').flatMap((record) => (record.program ? [record.program] : [])),
                                        (item) => item.id,
                                    ).map((item) => ({ value: item.id.toString(), label: item.name })),
                                )}
                                {selector(
                                    'matrix-year',
                                    'Year',
                                    year,
                                    (values) => handleFilterChange('year', values),
                                    unique(
                                        availableFor('year').flatMap((record) => (record.completed_year ? [record.completed_year] : [])),
                                    ).sort((a, b) => b - a).map((item) => ({ value: item.toString(), label: item.toString() })),
                                )}
                                {selector(
                                    'matrix-adviser',
                                    'Adviser',
                                    adviser,
                                    (values) => handleFilterChange('adviser', values),
                                    unique(
                                        availableFor('adviser').flatMap((record) => (record.adviser ? [record.adviser] : [])),
                                        (item) => item.id,
                                    ).sort((a, b) => formatName(a).localeCompare(formatName(b))).map((item) => ({ value: item.id.toString(), label: formatName(item) })),
                                )}
                                {selector(
                                    'matrix-panelist',
                                    'Panelist',
                                    panelist,
                                    (values) => handleFilterChange('panelist', values),
                                    unique(
                                        availableFor('panelist').flatMap((record) => record.panelists ?? []),
                                        (item) => item.id,
                                    ).sort((a, b) => formatName(a).localeCompare(formatName(b))).map((item) => ({ value: item.id.toString(), label: formatName(item) })),
                                )}
                                {selector(
                                    'matrix-keyword',
                                    'Keyword',
                                    keyword,
                                    (values) => handleFilterChange('keyword', values),
                                    unique(
                                        availableFor('keyword').flatMap((record) => record.keywords ?? []),
                                        (item) => item.id,
                                    ).sort((a, b) => a.keyword_name.localeCompare(b.keyword_name)).map((item) => ({ value: item.id.toString(), label: item.keyword_name })),
                                )}
                                {selector(
                                    'matrix-status',
                                    'Status',
                                    status,
                                    (values) => handleFilterChange('status', values),
                                    unique(
                                        availableFor('status').flatMap((record) => (record.status ? [record.status] : [])),
                                    ).sort().map((item) => ({ value: item, label: item })),
                                )}
                            </div>
                            <p className="text-sm font-medium">Records: {filterRecords().length}</p>
                            <div className="flex gap-2">
                                <Button onClick={goToColumns}>Next: Select Columns</Button>
                                {Object.values(filterValues).some((value) => value.length > 0) && (
                                    <Button onClick={resetFilters} variant="outline">
                                        <X className="mr-2 h-4 w-4" />
                                        Reset
                                    </Button>
                                )}
                                {/* Next action sits on the right: "Next:" label beside the Select Columns button */}
                                <div className="ml-auto flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Next:</span>
                                    <Button onClick={goToColumns}>Select Columns</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="font-semibold">Select Columns</h3>
                                <p className="text-sm text-muted-foreground">
                                    Fields used in Step 1 are selected automatically. Add or remove columns as needed.
                                    Reset Columns restores only this selected-column list and keeps your filters unchanged.
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {columnGroups.map((group) => (
                                <Card key={group.label} className="border-[0.2px] border-slate-200 shadow-none dark:border-slate-700">                                        <CardHeader className="pb-3">
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
                            <div className="flex gap-2">
                                <Button onClick={() => setStep(1)} variant="outline">
                                    Back to Filters
                                </Button>
                                <Button onClick={resetColumns} variant="ghost">
                                    Reset Columns
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