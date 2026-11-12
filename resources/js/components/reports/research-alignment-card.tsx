import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatName } from '@/lib/report-format';
import type { AlignmentCategory, Faculty, Program, Research } from '@/types/reports';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

type AlignmentGroup = {
    category: Exclude<AlignmentCategory, 'all' | 'any'>;
    label: string;
    items: Array<{ id: number; name: string }>;
};

interface Props {
    records: Research[];
    programs: Program[];
    years: number[];
    advisers: Faculty[];
    statuses: string[];
}

export default function ResearchAlignmentCard({ records, programs, years, advisers, statuses }: Props) {
    const [year, setYear] = useState('all');
    const [program, setProgram] = useState('all');
    const [adviser, setAdviser] = useState('all');
    const [status, setStatus] = useState('all');
    const [alignmentCategory, setAlignmentCategory] = useState<AlignmentCategory>('all');
    const [selectedAlignmentTypes, setSelectedAlignmentTypes] = useState<string[]>([]);
    const [menuOpen, setMenuOpen] = useState(false);

    const unique = <T,>(values: T[], key: (value: T) => string | number) => Array.from(new Map(values.map((value) => [key(value), value])).values());

    const alignmentGroups = useMemo<AlignmentGroup[]>(
        () =>
            [
                {
                    category: 'sdg',
                    label: 'SDG',
                    items: unique(
                        records.flatMap((record) => record.sdgs ?? []),
                        (item) => item.id,
                    ),
                },
                {
                    category: 'srig',
                    label: 'SRIG',
                    items: unique(
                        records.flatMap((record) => record.srigs ?? []),
                        (item) => item.id,
                    ),
                },
                {
                    category: 'agenda',
                    label: 'Agenda',
                    items: unique(
                        records.flatMap((record) => record.agendas ?? []),
                        (item) => item.id,
                    ),
                },
            ].map((group) => ({
                ...group,
                items: group.items.sort((a, b) => a.name.localeCompare(b.name)),
            })),
        [records],
    );

    const alignmentKey = (category: string, id: number) => `${category}:${id}`;
    const allAlignmentKeys = alignmentGroups.flatMap((group) => group.items.map((item) => alignmentKey(group.category, item.id)));
    const visibleGroups =
        alignmentCategory === 'all' || alignmentCategory === 'any'
            ? alignmentGroups
            : alignmentGroups.filter((group) => group.category === alignmentCategory);
    const activeAlignmentTypes = alignmentCategory === 'all' ? allAlignmentKeys : selectedAlignmentTypes;

    const handleCategoryChange = (value: string) => {
        const category = value as AlignmentCategory;
        setAlignmentCategory(category);
        setSelectedAlignmentTypes(category === 'all' ? allAlignmentKeys : []);
    };

    const reset = () => {
        setYear('all');
        setProgram('all');
        setAdviser('all');
        setStatus('all');
        setAlignmentCategory('all');
        setSelectedAlignmentTypes([]);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Research Alignment</CardTitle>
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
                                            : activeAlignmentTypes.length
                                              ? `${activeAlignmentTypes.length} alignment type${activeAlignmentTypes.length === 1 ? '' : 's'} selected`
                                              : 'Select alignment types'}
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
                <div className="flex justify-end">
                    <Button variant="outline" onClick={reset}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </div>
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
        <Card>
            <CardContent className="space-y-2 p-4">
                <p className="text-sm font-medium">{label}</p>
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger>
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
