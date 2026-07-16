import AppLayout from '@/layouts/app/app-layout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { Search, Download, FileText, FileSpreadsheet, Filter, X, ChevronDown, BookOpen, Table as TableIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Program {
	id: number;
	name: string;
}

interface Faculty {
	id: number;
	first_name: string;
	middle_name?: string;
	last_name: string;
}

interface Researcher {
	id: number;
	first_name: string;
	middle_name?: string;
	last_name: string;
}

interface SDG {
	id: number;
	name: string;
}

interface SRIG {
	id: number;
	name: string;
}

interface Agenda {
	id: number;
	name: string;
}

interface Research {
	id: number;
	research_title: string;
	published_month?: number;
	published_year?: number;
	program?: Program;
	adviser?: Faculty;
	researchers?: Researcher[];
	sdgs?: SDG[];
	srigs?: SRIG[];
	agendas?: Agenda[];
}

interface Props {
	records: Research[];
	programs: Program[];
	years: number[];
	filters: {
		search?: string;
		program?: string | number;
		year?: string | number;
	};
}

export default function ResearchMatrixIndex({ records, programs, years, filters }: Props) {
	const [localSearch, setLocalSearch] = useState(filters.search || '');
	const [selectedProgram, setSelectedProgram] = useState<string>(filters.program?.toString() || 'all');
	const [selectedYear, setSelectedYear] = useState<string>(filters.year?.toString() || 'all');
	const [isExporting, setIsExporting] = useState(false);

	const formatName = (person: Faculty | Researcher | undefined) => {
		if (!person) return 'N/A';
		const middle = person.middle_name ? ` ${person.middle_name.charAt(0)}.` : '';
		return `${person.first_name}${middle} ${person.last_name}`;
	};

	const formatMonthYear = (month?: number, year?: number) => {
		if (!year) return 'N/A';
		if (!month) return year.toString();
		const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
						  'July', 'August', 'September', 'October', 'November', 'December'];
		return `${monthNames[month]} ${year}`;
	};

	const groupedRecords = useMemo(() => {
		const grouped: Record<string, Record<string, Research[]>> = {};

		records.forEach(record => {
			const programName = record.program?.name || 'No Program';
			const year = record.published_year?.toString() || 'Unknown Year';

			if (!grouped[programName]) {
				grouped[programName] = {};
			}
			if (!grouped[programName][year]) {
				grouped[programName][year] = [];
			}
			grouped[programName][year].push(record);
		});

		return grouped;
	}, [records]);

	const handleFilter = () => {
		router.get('/reports', {
			search: localSearch || undefined,
			program: selectedProgram !== 'all' ? selectedProgram : undefined,
			year: selectedYear !== 'all' ? selectedYear : undefined,
		}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleReset = () => {
		setLocalSearch('');
		setSelectedProgram('all');
		setSelectedYear('all');
		router.get('/reports', {}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const hasActiveFilters = localSearch || selectedProgram !== 'all' || selectedYear !== 'all';

	const handleExportMatrix = () => {
		setIsExporting(true);
		const params = new URLSearchParams();

		if (localSearch) params.append('search', localSearch);
		if (selectedProgram !== 'all') params.append('program', selectedProgram);
		if (selectedYear !== 'all') params.append('year', selectedYear);

		const url = `/reports/export-pdf${params.toString() ? '?' + params.toString() : ''}`;
		window.location.href = url;

		setTimeout(() => {
			setIsExporting(false);
		}, 3000);
	};

	const handleExportCompilation = () => {
		setIsExporting(true);
		const params = new URLSearchParams();

		if (localSearch) params.append('search', localSearch);
		if (selectedProgram !== 'all') params.append('program', selectedProgram);
		if (selectedYear !== 'all') params.append('year', selectedYear);

		const url = `/reports/export-compilation${params.toString() ? '?' + params.toString() : ''}`;
		window.location.href = url;

		setTimeout(() => {
			setIsExporting(false);
		}, 3000);
	};

	return (
		<AppLayout title="Reports & Analytics">
			<Head title="Reports & Analytics" />

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Research Matrix Generator</CardTitle>
						<CardDescription>
							Filter and group research records by program and year. Export to PDF or Excel format.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-2">
								<label htmlFor="search" className="text-sm font-medium">
									Search
								</label>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										id="search"
										placeholder="Title, keywords..."
										value={localSearch}
										onChange={(e) => setLocalSearch(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
										className="pl-9"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label htmlFor="program" className="text-sm font-medium">
									Program
								</label>
								<Select value={selectedProgram} onValueChange={setSelectedProgram}>
									<SelectTrigger id="program">
										<SelectValue placeholder="All Programs" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Programs</SelectItem>
										{programs.map((program) => (
											<SelectItem key={program.id} value={program.id.toString()}>
												{program.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label htmlFor="year" className="text-sm font-medium">
									Year
								</label>
								<Select value={selectedYear} onValueChange={setSelectedYear}>
									<SelectTrigger id="year">
										<SelectValue placeholder="All Years" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Years</SelectItem>
										{years.map((year) => (
											<SelectItem key={year} value={year.toString()}>
												{year}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium opacity-0">Actions</label>
								<div className="flex gap-2">
									<Button onClick={handleFilter} className="flex-1">
										<Filter className="h-4 w-4 mr-2" />
										Apply
									</Button>
									{hasActiveFilters && (
										<Button onClick={handleReset} variant="outline" size="icon">
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3 pt-2 border-t">
							<span className="text-sm font-medium">Export:</span>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="default"
										size="sm"
										disabled={isExporting || records.length === 0}
									>
										<Download className="h-4 w-4 mr-2" />
										{isExporting ? 'Generating Report...' : 'Export Report'}
										<ChevronDown className="h-4 w-4 ml-2" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="start" className="w-64">
									<DropdownMenuItem
										onClick={handleExportMatrix}
										disabled={isExporting || records.length === 0}
										className="flex flex-col items-start py-3 cursor-pointer"
									>
										<div className="flex items-center gap-2 font-medium">
											<TableIcon className="h-4 w-4" />
											Matrix Report
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											Table format with all data
										</p>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={handleExportCompilation}
										disabled={isExporting || records.length === 0}
										className="flex flex-col items-start py-3 cursor-pointer"
									>
										<div className="flex items-center gap-2 font-medium">
											<BookOpen className="h-4 w-4" />
											Create Compilation
										</div>
										<p className="text-xs text-muted-foreground mt-1">
											Styled book format
										</p>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						<div className="text-sm text-gray-600">
							Showing <span className="font-semibold">{records.length}</span> research record{records.length !== 1 ? 's' : ''}
							{hasActiveFilters && ' (filtered)'}
						</div>
					</CardContent>
				</Card>

				{Object.keys(groupedRecords).length === 0 ? (
					<Card>
						<CardContent className="py-12 text-center text-gray-500">
							<FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p className="text-lg font-medium">No research records found</p>
							<p className="text-sm mt-1">Try adjusting your filters</p>
						</CardContent>
					</Card>
				) : (
					Object.entries(groupedRecords).map(([programName, yearGroups]) => (
						<Card key={programName} className="overflow-hidden">
							<CardHeader className="bg-gray-50 border-b">
								<CardTitle className="text-lg">{programName}</CardTitle>
								<CardDescription>
									{Object.values(yearGroups).flat().length} research record(s)
								</CardDescription>
							</CardHeader>
							<CardContent className="p-0">
								{Object.entries(yearGroups)
									.sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
									.map(([year, researches]) => (
										<div key={year} className="border-b last:border-b-0">
											<div className="bg-gray-100 px-6 py-3 border-b">
												<h3 className="font-semibold text-gray-900">Year: {year}</h3>
												<p className="text-sm text-gray-600">{researches.length} record(s)</p>
											</div>

											<div className="overflow-x-auto">
												<Table>
													<TableHeader>
														<TableRow>
															<TableHead className="w-16">ID</TableHead>
															<TableHead className="min-w-[300px]">Title</TableHead>
															<TableHead className="min-w-[200px]">Researchers</TableHead>
															<TableHead className="min-w-[150px]">Adviser</TableHead>
															<TableHead className="min-w-[140px]">Completion Date</TableHead>
															<TableHead className="min-w-[150px]">SDG</TableHead>
															<TableHead className="min-w-[150px]">SRIG</TableHead>
															<TableHead className="min-w-[150px]">Research Agenda</TableHead>
														</TableRow>
													</TableHeader>
													<TableBody>
														{researches.map((research) => (
															<TableRow key={research.id}>
																<TableCell className="font-mono text-xs">
																	{research.id}
																</TableCell>
																<TableCell>
																	<div className="font-medium text-sm line-clamp-2">
																		{research.research_title}
																	</div>
																</TableCell>
																<TableCell>
																	<div className="text-sm space-y-1">
																		{research.researchers && research.researchers.length > 0 ? (
																			research.researchers.map((researcher) => (
																				<div key={researcher.id} className="text-gray-700">
																					{formatName(researcher)}
																				</div>
																			))
																		) : (
																			<span className="text-gray-400 italic">No researchers</span>
																		)}
																	</div>
																</TableCell>
																<TableCell className="text-sm">
																	{formatName(research.adviser)}
																</TableCell>
																<TableCell className="text-sm whitespace-nowrap">
																	{formatMonthYear(research.published_month, research.published_year)}
																</TableCell>
																<TableCell>
																	<div className="flex flex-wrap gap-1">
																		{research.sdgs && research.sdgs.length > 0 ? (
																			research.sdgs.map((sdg) => (
																				<Badge key={sdg.id} variant="secondary" className="text-xs">
																					{sdg.name}
																				</Badge>
																			))
																		) : (
																			<span className="text-xs text-gray-400 italic">None</span>
																		)}
																	</div>
																</TableCell>
																<TableCell>
																	<div className="flex flex-wrap gap-1">
																		{research.srigs && research.srigs.length > 0 ? (
																			research.srigs.map((srig) => (
																				<Badge key={srig.id} variant="secondary" className="text-xs">
																					{srig.name}
																				</Badge>
																			))
																		) : (
																			<span className="text-xs text-gray-400 italic">None</span>
																		)}
																	</div>
																</TableCell>
																<TableCell>
																	<div className="flex flex-wrap gap-1">
																		{research.agendas && research.agendas.length > 0 ? (
																			research.agendas.map((agenda) => (
																				<Badge key={agenda.id} variant="secondary" className="text-xs">
																					{agenda.name}
																				</Badge>
																			))
																		) : (
																			<span className="text-xs text-gray-400 italic">None</span>
																		)}
																	</div>
																</TableCell>
															</TableRow>
														))}
													</TableBody>
												</Table>
											</div>
										</div>
									))}
							</CardContent>
						</Card>
					))
				)}
			</div>
		</AppLayout>
	);
}
