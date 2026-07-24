import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Filter, X, ChevronDown, Eye } from 'lucide-react';
import { useState } from 'react';
import { formatName, formatMonthYear } from '@/lib/report-format';
import type { Research, ReportCardProps } from '@/types/reports';
import ReportPreviewModal from '@/components/modals/report-preview-modal';

export default function MatrixReportCard({ records, programs, years, advisers, statuses, filters }: ReportCardProps) {
	const [program, setProgram] = useState<string>(filters.program?.toString() || 'all');
	const [year, setYear] = useState<string>(filters.year?.toString() || 'all');
	const [adviser, setAdviser] = useState<string>(filters.adviser?.toString() || 'all');
	const [status, setStatus] = useState<string>(filters.status || 'all');

	const [filtered, setFiltered] = useState<Research[]>([]);
	const [applied, setApplied] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewUrl, setPreviewUrl] = useState('');

	const hasActiveFilters = program !== 'all' || year !== 'all' || adviser !== 'all' || status !== 'all';

	const buildParams = (extra?: Record<string, string>) => {
		const params = new URLSearchParams();
		if (program !== 'all') params.append('program', program);
		if (year !== 'all') params.append('year', year);
		if (adviser !== 'all') params.append('adviser', adviser);
		if (status !== 'all') params.append('status', status);
		if (extra) Object.entries(extra).forEach(([key, value]) => params.append(key, value));
		return params;
	};

	const apiPrefix = () => (window.location.pathname.includes('/admin') ? '/admin' : '/staff');

	const handleFilter = () => {
		let result = [...records];

		if (program !== 'all') result = result.filter((r) => r.program?.id.toString() === program);
		if (year !== 'all') result = result.filter((r) => r.published_year?.toString() === year);
		if (adviser !== 'all') result = result.filter((r) => r.adviser?.id.toString() === adviser);
		if (status !== 'all') result = result.filter((r) => r.status === status);

		result.sort((a, b) => {
			const yearA = a.published_year ?? 0;
			const yearB = b.published_year ?? 0;
			if (yearA !== yearB) return yearA - yearB;
			return (a.published_month ?? 0) - (b.published_month ?? 0);
		});

		setFiltered(result);
		setApplied(true);
	};

	const handleReset = () => {
		setProgram('all');
		setYear('all');
		setAdviser('all');
		setStatus('all');
		setApplied(false);
		setFiltered([]);
	};

	const handlePreview = () => {
		const params = buildParams({ format: 'pdf', preview: '1' });
		setPreviewUrl(`${apiPrefix()}/reports/export-matrix?${params.toString()}`);
		setPreviewOpen(true);
	};

	const handleExport = (format: 'pdf' | 'docx' | 'excel') => {
		setIsExporting(true);
		const params = buildParams({ format });
		window.location.href = `${apiPrefix()}/reports/export-matrix?${params.toString()}`;
		setTimeout(() => setIsExporting(false), 3000);
	};

	return (
		<>
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
							<Select value={program} onValueChange={setProgram}>
								<SelectTrigger id="matrix-program">
									<SelectValue placeholder="All Programs" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Programs</SelectItem>
									{programs.map((p) => (
										<SelectItem key={p.id} value={p.id.toString()}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label htmlFor="matrix-year" className="text-sm font-medium">
								Year
							</label>
							<Select value={year} onValueChange={setYear}>
								<SelectTrigger id="matrix-year">
									<SelectValue placeholder="All Years" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Years</SelectItem>
									{years.map((y) => (
										<SelectItem key={y} value={y.toString()}>
											{y}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label htmlFor="matrix-adviser" className="text-sm font-medium">
								Adviser
							</label>
							<Select value={adviser} onValueChange={setAdviser}>
								<SelectTrigger id="matrix-adviser">
									<SelectValue placeholder="All Advisers" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Advisers</SelectItem>
									{advisers.map((a) => (
										<SelectItem key={a.id} value={a.id.toString()}>
											{formatName(a)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<label htmlFor="matrix-status" className="text-sm font-medium">
								Status
							</label>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger id="matrix-status">
									<SelectValue placeholder="All Statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									{statuses.map((s) => (
										<SelectItem key={s} value={s}>
											{s}
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
								{(hasActiveFilters || applied) && (
									<Button onClick={handleReset} variant="outline" size="icon">
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</div>

					{applied && (
						<div className="space-y-4 pt-4 border-t">
							<div className="flex justify-between items-center">
								<h3 className="font-semibold text-lg">Results ({filtered.length} records)</h3>
								<div className="flex items-center gap-3">
									<Button variant="outline" size="sm" onClick={handlePreview} disabled={filtered.length === 0}>
										<Eye className="h-4 w-4 mr-2" />
										Preview
									</Button>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="default" size="sm" disabled={isExporting || filtered.length === 0}>
												<Download className="h-4 w-4 mr-2" />
												{isExporting ? 'Generating...' : 'Export'}
												<ChevronDown className="h-4 w-4 ml-2" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-48">
											<DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting || filtered.length === 0} className="cursor-pointer">
												<span>PDF</span>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleExport('docx')} disabled={isExporting || filtered.length === 0} className="cursor-pointer">
												<span>DOCX</span>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting || filtered.length === 0} className="cursor-pointer">
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
										{filtered.map((r) => (
											<TableRow key={r.id}>
												<TableCell className="text-sm">{r.id}</TableCell>
												<TableCell className="text-sm font-medium max-w-xs truncate">{r.research_title}</TableCell>
												<TableCell className="text-sm">{formatName(r.adviser)}</TableCell>
												<TableCell className="text-sm">{r.researchers?.map((res) => formatName(res)).join(', ')}</TableCell>
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

			<ReportPreviewModal
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				title="Matrix Report Preview"
				previewUrl={previewUrl}
			/>
		</>
	);
}