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
	advisers: Faculty[];
	statuses: string[];
	
	filters: {
		search?: string;
		program?: string | number;
		year?: string | number;
		adviser?: string | number;
    	status?: string;
	};
}

export default function ResearchMatrixIndex({ records, programs, years, advisers, statuses, filters }: Props) {
	// const [localSearch, setLocalSearch] = useState(filters.search || '');
	const [selectedProgram, setSelectedProgram] = useState<string>(filters.program?.toString() || 'all');
	const [selectedYear, setSelectedYear] = useState<string>(filters.year?.toString() || 'all');
	const [selectedAdviser, setSelectedAdviser] = useState<string>(filters.adviser?.toString() || 'all');
	const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || 'all');	

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
			program: selectedProgram !== 'all' ? selectedProgram : undefined,
			year: selectedYear !== 'all' ? selectedYear : undefined,
			adviser: selectedAdviser !== 'all' ? selectedAdviser : undefined,
			status: selectedStatus !== 'all' ? selectedStatus : undefined,
		}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleReset = () => {
		setSelectedProgram('all');
		setSelectedYear('all');
		setSelectedAdviser('all');
		setSelectedStatus('all');
		router.get('/reports', {}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const hasActiveFilters = selectedProgram !== 'all' || selectedYear !== 'all' || selectedAdviser !== 'all' || selectedStatus !== 'all';

	const handleExportMatrix = (format: 'pdf' | 'docx' | 'excel') => {
		setIsExporting(true);
		const params = new URLSearchParams();

		if (selectedProgram !== 'all') params.append('program', selectedProgram);
		if (selectedYear !== 'all') params.append('year', selectedYear);
		if (selectedAdviser !== 'all') params.append('adviser', selectedAdviser);
		if (selectedStatus !== 'all') params.append('status', selectedStatus);
		params.append('format', format);

		const url = `/reports/export-matrix${params.toString() ? '?' + params.toString() : ''}`;
		window.location.href = url;

		setTimeout(() => {
			setIsExporting(false);
		}, 3000);
	};

	const handleExportCompilation = (format: 'pdf' | 'docx' | 'excel') => {
		setIsExporting(true);
		const params = new URLSearchParams();

		if (selectedProgram !== 'all') params.append('program', selectedProgram);
		if (selectedYear !== 'all') params.append('year', selectedYear);
		if (selectedAdviser !== 'all') params.append('adviser', selectedAdviser);
		if (selectedStatus !== 'all') params.append('status', selectedStatus);
		params.append('format', format);

		const url = `/reports/export-compiled${params.toString() ? '?' + params.toString() : ''}`;
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
							Filter and group research records by program, year, adviser, and status. Export to PDF, DOCX, or Excel format.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
								<label htmlFor="adviser" className="text-sm font-medium">
									Adviser
								</label>
								<Select value={selectedAdviser} onValueChange={setSelectedAdviser}>
									<SelectTrigger id="adviser">
										<SelectValue placeholder="All Advisers" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Advisers</SelectItem>
										{advisers.map((adviser) => (
											<SelectItem key={adviser.id} value={adviser.id.toString()}>
												{formatName(adviser)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label htmlFor="status" className="text-sm font-medium">
									Status
								</label>
								<Select value={selectedStatus} onValueChange={setSelectedStatus}>
									<SelectTrigger id="status">
										<SelectValue placeholder="All Statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										{statuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
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
									{/* Matrix Report Formats */}
									<DropdownMenuItem
										onClick={() => handleExportMatrix('pdf')}
										disabled={isExporting || records.length === 0}
										className="py-2 cursor-pointer"
									>
										<span className="font-medium">Matrix Report (PDF)</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleExportMatrix('docx')}
										disabled={isExporting || records.length === 0}
										className="py-2 cursor-pointer"
									>
										<span className="font-medium">Matrix Report (DOCX)</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleExportMatrix('excel')}
										disabled={isExporting || records.length === 0}
										className="py-2 cursor-pointer"
									>
										<span className="font-medium">Matrix Report (Excel)</span>
									</DropdownMenuItem>

								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Compiled Report Generator</CardTitle>

						<CardDescription>
							Filter and group research records by program, year, adviser, and status. Export to PDF, DOCX, or Excel format.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
								<label htmlFor="adviser" className="text-sm font-medium">
									Adviser
								</label>
								<Select value={selectedAdviser} onValueChange={setSelectedAdviser}>
									<SelectTrigger id="adviser">
										<SelectValue placeholder="All Advisers" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Advisers</SelectItem>
										{advisers.map((adviser) => (
											<SelectItem key={adviser.id} value={adviser.id.toString()}>
												{formatName(adviser)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<label htmlFor="status" className="text-sm font-medium">
									Status
								</label>
								<Select value={selectedStatus} onValueChange={setSelectedStatus}>
									<SelectTrigger id="status">
										<SelectValue placeholder="All Statuses" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Statuses</SelectItem>
										{statuses.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
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
									{/* Matrix Report Formats */}
									<DropdownMenuItem
										onClick={() => handleExportCompilation('pdf')}
										disabled={isExporting || records.length === 0}
										className="py-2 cursor-pointer"
									>
										<span className="font-medium">Matrix Report (PDF)</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleExportCompilation('docx')}
										disabled={isExporting || records.length === 0}
										className="py-2 cursor-pointer"
									>
										<span className="font-medium">Matrix Report (DOCX)</span>
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => handleExportCompilation('excel')}
										disabled={isExporting || records.length === 0}
										className="py-2 cursor-pointer"
									>
										<span className="font-medium">Matrix Report (Excel)</span>
									</DropdownMenuItem>

								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</CardContent>
				</Card>

				
			</div>
		</AppLayout>
	);
}
