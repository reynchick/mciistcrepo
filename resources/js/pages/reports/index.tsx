import AppLayout from '@/layouts/app/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useMemo } from 'react';
import { Download, Filter, X, ChevronDown, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
	status?: string;  
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
	// Matrix filters
	const [matrixProgram, setMatrixProgram] = useState<string>(filters.program?.toString() || 'all');
	const [matrixYear, setMatrixYear] = useState<string>(filters.year?.toString() || 'all');
	const [matrixAdviser, setMatrixAdviser] = useState<string>(filters.adviser?.toString() || 'all');
	const [matrixStatus, setMatrixStatus] = useState<string>(filters.status || 'all');
	const [matrixFiltered, setMatrixFiltered] = useState<Research[]>([]);
	const [matrixApplied, setMatrixApplied] = useState(false);
	const [matrixPreviewOpen, setMatrixPreviewOpen] = useState(false);
	const [matrixPreviewUrl, setMatrixPreviewUrl] = useState('');

	// Compiled filters
	const [compiledProgram, setCompiledProgram] = useState<string>('all');
	const [compiledYear, setCompiledYear] = useState<string>('all');
	const [compiledAdviser, setCompiledAdviser] = useState<string>('all');
	const [compiledStatus, setCompiledStatus] = useState<string>('all');
	const [compiledFiltered, setCompiledFiltered] = useState<Research[]>([]);
	const [compiledApplied, setCompiledApplied] = useState(false);
	const [compiledPreviewOpen, setCompiledPreviewOpen] = useState(false);
	const [compiledPreviewUrl, setCompiledPreviewUrl] = useState('');

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

	const formatTagList = (items?: any[], field: string = 'name') => {
		if (!items || items.length === 0) return 'N/A';
		return items.map(item => item[field]).join(', ');
	};

	// Apply Matrix filters
	const handleMatrixFilter = () => {
		let filtered = [...records];

		if (matrixProgram !== 'all') {
			filtered = filtered.filter(r => r.program?.id.toString() === matrixProgram);
		}
		if (matrixYear !== 'all') {
			filtered = filtered.filter(r => r.published_year?.toString() === matrixYear);
		}
		if (matrixAdviser !== 'all') {
			filtered = filtered.filter(r => r.adviser?.id.toString() === matrixAdviser);
		}
		if (matrixStatus !== 'all') {
			filtered = filtered.filter(r => r.status === matrixStatus);
		}

		filtered.sort((a, b) => {
			const yearA = a.published_year ?? 0;
			const yearB = b.published_year ?? 0;
			if (yearA !== yearB) return yearA - yearB;
			return (a.published_month ?? 0) - (b.published_month ?? 0);
		});

		setMatrixFiltered(filtered);
		setMatrixApplied(true);
	};

	// Apply Compiled filters
	const handleCompiledFilter = () => {
		let filtered = [...records];

		if (compiledProgram !== 'all') {
			filtered = filtered.filter(r => r.program?.id.toString() === compiledProgram);
		}
		if (compiledYear !== 'all') {
			filtered = filtered.filter(r => r.published_year?.toString() === compiledYear);
		}
		if (compiledAdviser !== 'all') {
			filtered = filtered.filter(r => r.adviser?.id.toString() === compiledAdviser);
		}
		if (compiledStatus !== 'all') {
			filtered = filtered.filter(r => r.status === compiledStatus);
		}

		filtered.sort((a, b) => {
			const yearA = a.published_year ?? 0;
			const yearB = b.published_year ?? 0;
			if (yearA !== yearB) return yearA - yearB;
			return (a.published_month ?? 0) - (b.published_month ?? 0);
		});

		setCompiledFiltered(filtered);
		setCompiledApplied(true);
	};

	// Reset Matrix filters
	const handleMatrixReset = () => {
		setMatrixProgram('all');
		setMatrixYear('all');
		setMatrixAdviser('all');
		setMatrixStatus('all');
		setMatrixApplied(false);
		setMatrixFiltered([]);
	};

	// Reset Compiled filters
	const handleCompiledReset = () => {
		setCompiledProgram('all');
		setCompiledYear('all');
		setCompiledAdviser('all');
		setCompiledStatus('all');
		setCompiledApplied(false);
		setCompiledFiltered([]);
	};

	const matrixHasActiveFilters = matrixProgram !== 'all' || matrixYear !== 'all' || matrixAdviser !== 'all' || matrixStatus !== 'all';
	const compiledHasActiveFilters = compiledProgram !== 'all' || compiledYear !== 'all' || compiledAdviser !== 'all' || compiledStatus !== 'all';

	const handlePreviewMatrix = () => {
		const params = new URLSearchParams();
		if (matrixProgram !== 'all') params.append('program', matrixProgram);
		if (matrixYear !== 'all') params.append('year', matrixYear);
		if (matrixAdviser !== 'all') params.append('adviser', matrixAdviser);
		if (matrixStatus !== 'all') params.append('status', matrixStatus);
		params.append('format', 'pdf');
		params.append('preview', '1');

		const prefix = window.location.pathname.includes('/admin') ? '/admin' : '/staff';
		setMatrixPreviewUrl(`${prefix}/reports/export-matrix?${params.toString()}`);
		setMatrixPreviewOpen(true);
	};

	const handlePreviewCompiled = () => {
		const params = new URLSearchParams();
		if (compiledProgram !== 'all') params.append('program', compiledProgram);
		if (compiledYear !== 'all') params.append('year', compiledYear);
		if (compiledAdviser !== 'all') params.append('adviser', compiledAdviser);
		if (compiledStatus !== 'all') params.append('status', compiledStatus);
		params.append('format', 'pdf');
		params.append('preview', '1');

		const prefix = window.location.pathname.includes('/admin') ? '/admin' : '/staff';
		setCompiledPreviewUrl(`${prefix}/reports/export-compiled?${params.toString()}`);
		setCompiledPreviewOpen(true);
	};

	const handleExportMatrix = (format: 'pdf' | 'docx' | 'excel') => {
		setIsExporting(true);
		const params = new URLSearchParams();

		if (matrixProgram !== 'all') params.append('program', matrixProgram);
		if (matrixYear !== 'all') params.append('year', matrixYear);
		if (matrixAdviser !== 'all') params.append('adviser', matrixAdviser);
		if (matrixStatus !== 'all') params.append('status', matrixStatus);
		params.append('format', format);

		const prefix = window.location.pathname.includes('/admin') ? '/admin' : '/staff';
   		const url = `${prefix}/reports/export-matrix${params.toString() ? '?' + params.toString() : ''}`;
		window.location.href = url;

		setTimeout(() => {
			setIsExporting(false);
		}, 3000);
	};

	const handleExportCompilation = (format: 'pdf' | 'docx' | 'excel') => {
		setIsExporting(true);
		const params = new URLSearchParams();

		if (compiledProgram !== 'all') params.append('program', compiledProgram);
		if (compiledYear !== 'all') params.append('year', compiledYear);
		if (compiledAdviser !== 'all') params.append('adviser', compiledAdviser);
		if (compiledStatus !== 'all') params.append('status', compiledStatus);
		params.append('format', format);

		const prefix = window.location.pathname.includes('/admin') ? '/admin' : '/staff';
		const url = `${prefix}/reports/export-compiled${params.toString() ? '?' + params.toString() : ''}`;
		window.location.href = url;

		setTimeout(() => {
			setIsExporting(false);
		}, 3000);
	};

	return (
		<AppLayout title="Reports & Analytics">
			<Head title="Reports & Analytics" />

			<div className="space-y-6">
				{/* MATRIX REPORT SECTION */}
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
								<label htmlFor="matrix-program" className="text-sm font-medium">
									Program
								</label>
								<Select value={matrixProgram} onValueChange={setMatrixProgram}>
									<SelectTrigger id="matrix-program">
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
								<label htmlFor="matrix-year" className="text-sm font-medium">
									Year
								</label>
								<Select value={matrixYear} onValueChange={setMatrixYear}>
									<SelectTrigger id="matrix-year">
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
								<label htmlFor="matrix-adviser" className="text-sm font-medium">
									Adviser
								</label>
								<Select value={matrixAdviser} onValueChange={setMatrixAdviser}>
									<SelectTrigger id="matrix-adviser">
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
								<label htmlFor="matrix-status" className="text-sm font-medium">
									Status
								</label>
								<Select value={matrixStatus} onValueChange={setMatrixStatus}>
									<SelectTrigger id="matrix-status">
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
									<Button onClick={handleMatrixFilter} className="flex-1">
										<Filter className="h-4 w-4 mr-2" />
										Apply
									</Button>
									{(matrixHasActiveFilters || matrixApplied) && (
										<Button onClick={handleMatrixReset} variant="outline" size="icon">
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							</div>
						</div>

						{/* MATRIX RESULTS TABLE */}
						{matrixApplied && (
							<div className="space-y-4 pt-4 border-t">
								<div className="flex justify-between items-center">
									<h3 className="font-semibold text-lg">Results ({matrixFiltered.length} records)</h3>
									<div className="flex items-center gap-3">
										<Button variant="outline" size="sm" onClick={handlePreviewMatrix} disabled={matrixFiltered.length === 0}>
											<Eye className="h-4 w-4 mr-2" />
											Preview
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="default"
													size="sm"
													disabled={isExporting || matrixFiltered.length === 0}
												>
													<Download className="h-4 w-4 mr-2" />
													{isExporting ? 'Generating...' : 'Export'}
													<ChevronDown className="h-4 w-4 ml-2" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-48">
												<DropdownMenuItem
													onClick={() => handleExportMatrix('pdf')}
													disabled={isExporting || matrixFiltered.length === 0}
													className="cursor-pointer"
												>
													<span>PDF</span>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleExportMatrix('docx')}
													disabled={isExporting || matrixFiltered.length === 0}
													className="cursor-pointer"
												>
													<span>DOCX</span>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleExportMatrix('excel')}
													disabled={isExporting || matrixFiltered.length === 0}
													className="cursor-pointer"
												>
													<span>Excel</span>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>

								<div className="overflow-x-auto border rounded-md">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>ID</TableHead>
												<TableHead>Title</TableHead>
												<TableHead>Adviser</TableHead>
												<TableHead>Researchers</TableHead>
												<TableHead>Program</TableHead>
												<TableHead>Completion Date</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{matrixFiltered.map((r) => (
												<TableRow key={r.id}>
													<TableCell className="text-sm">{r.id}</TableCell>
													<TableCell className="text-sm font-medium max-w-xs truncate">{r.research_title}</TableCell>
													<TableCell className="text-sm">{formatName(r.adviser)}</TableCell>
													<TableCell className="text-sm">{r.researchers?.map(res => formatName(res)).join(', ')}</TableCell>
													<TableCell className="text-sm">{r.program?.name || 'N/A'}</TableCell>
													<TableCell className="text-sm">{formatMonthYear(r.published_month, r.published_year)}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* COMPILED REPORT SECTION */}
				<Card>
					<CardHeader>
						<CardTitle>Compiled Report Generator</CardTitle>

						<CardDescription>
							Filter and group research records by program, year, adviser, and status. Export to PDF or DOCX format.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<div className="space-y-2">
								<label htmlFor="compiled-program" className="text-sm font-medium">
									Program
								</label>
								<Select value={compiledProgram} onValueChange={setCompiledProgram}>
									<SelectTrigger id="compiled-program">
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
								<label htmlFor="compiled-year" className="text-sm font-medium">
									Year
								</label>
								<Select value={compiledYear} onValueChange={setCompiledYear}>
									<SelectTrigger id="compiled-year">
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
								<label htmlFor="compiled-adviser" className="text-sm font-medium">
									Adviser
								</label>
								<Select value={compiledAdviser} onValueChange={setCompiledAdviser}>
									<SelectTrigger id="compiled-adviser">
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
								<label htmlFor="compiled-status" className="text-sm font-medium">
									Status
								</label>
								<Select value={compiledStatus} onValueChange={setCompiledStatus}>
									<SelectTrigger id="compiled-status">
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
									<Button onClick={handleCompiledFilter} className="flex-1">
										<Filter className="h-4 w-4 mr-2" />
										Apply
									</Button>
									{(compiledHasActiveFilters || compiledApplied) && (
										<Button onClick={handleCompiledReset} variant="outline" size="icon">
											<X className="h-4 w-4" />
										</Button>
									)}
								</div>
							</div>
						</div>

						{/* COMPILED RESULTS TABLE */}
						{compiledApplied && (
							<div className="space-y-4 pt-4 border-t">
								<div className="flex justify-between items-center">
									<h3 className="font-semibold text-lg">Results ({compiledFiltered.length} records)</h3>
									<div className="flex items-center gap-3">
										<Button variant="outline" size="sm" onClick={handlePreviewCompiled} disabled={compiledFiltered.length === 0}> 
											<Eye className="h-4 w-4 mr-2" /> 
											Preview 
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="default"
													size="sm"
													disabled={isExporting || compiledFiltered.length === 0}
												>
													<Download className="h-4 w-4 mr-2" />
													{isExporting ? 'Generating...' : 'Export'}
													<ChevronDown className="h-4 w-4 ml-2" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-48">
												<DropdownMenuItem
													onClick={() => handleExportCompilation('pdf')}
													disabled={isExporting || compiledFiltered.length === 0}
													className="cursor-pointer"
												>
													<span>PDF</span>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleExportCompilation('docx')}
													disabled={isExporting || compiledFiltered.length === 0}
													className="cursor-pointer"
												>
													<span>DOCX</span>
												</DropdownMenuItem>
												{/* Excel temporarily disabled for Compiled report - may be needed later
												<DropdownMenuItem
													onClick={() => handleExportCompilation('excel')}
													disabled={isExporting || compiledFiltered.length === 0}
													className="cursor-pointer"
												>
													<span>Excel</span>
												</DropdownMenuItem>
												*/}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>

								<div className="overflow-x-auto border rounded-md">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>ID</TableHead>
												<TableHead>Title</TableHead>
												<TableHead>Adviser</TableHead>
												<TableHead>Researchers</TableHead>
												<TableHead>Program</TableHead>
												<TableHead>Completion Date</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{compiledFiltered.map((r) => (
												<TableRow key={r.id}>
													<TableCell className="text-sm">{r.id}</TableCell>
													<TableCell className="text-sm font-medium max-w-xs truncate">{r.research_title}</TableCell>
													<TableCell className="text-sm">{formatName(r.adviser)}</TableCell>
													<TableCell className="text-sm">{r.researchers?.map(res => formatName(res)).join(', ')}</TableCell>
													<TableCell className="text-sm">{r.program?.name || 'N/A'}</TableCell>
													<TableCell className="text-sm">{formatMonthYear(r.published_month, r.published_year)}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Matrix Preview Modal */}
				<Dialog open={matrixPreviewOpen} onOpenChange={setMatrixPreviewOpen}>
					<DialogContent className="w-[95vw] max-w-6xl sm:max-w-6xl h-[85vh] flex flex-col [&>button]:hidden">
						<DialogHeader className="flex flex-row items-center justify-between space-y-0">
							<DialogTitle>Matrix Report Preview</DialogTitle>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setMatrixPreviewOpen(false)}
								className="mr-6"
							>
								<X className="h-4 w-4" />
							</Button>
						</DialogHeader>
						{matrixPreviewUrl && (
							<iframe
								src={matrixPreviewUrl}
								className="flex-1 w-full border rounded-md"
								title="Matrix Report Preview"
							/>
						)}
					</DialogContent>
				</Dialog>

				{/* Compiled Preview Modal */}
				<Dialog open={compiledPreviewOpen} onOpenChange={setCompiledPreviewOpen}>
					<DialogContent className="w-[95vw] max-w-6xl sm:max-w-6xl h-[85vh] flex flex-col [&>button]:hidden">
						<DialogHeader className="flex flex-row items-center justify-between space-y-0">
							<DialogTitle>Compiled Report Preview</DialogTitle>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCompiledPreviewOpen(false)}
								className="mr-6"
							>
								<X className="h-4 w-4" />
							</Button>
						</DialogHeader>
						{compiledPreviewUrl && (
							<iframe
								src={compiledPreviewUrl}
								className="flex-1 w-full border rounded-md"
								title="Compiled Report Preview"
							/>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</AppLayout>
	);
}