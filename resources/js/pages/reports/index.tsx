import AppLayout from '@/layouts/app/app-layout';
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import MatrixReportCard from '@/components/reports/matrix-report-card';
import CompiledReportCard from '@/components/reports/compiled-report-card';
import type { ReportCardProps } from '@/types/reports';

export default function ResearchMatrixIndex(props: ReportCardProps) {
	return (
		<AppLayout>
			<Head title="Reports & Analytics" />

			<div className="space-y-6 p-4 sm:p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<Heading title="Reports & Analytics" description="View compiled and matrix reports for research performance." />
				</div>

				<div className="space-y-6">
					<MatrixReportCard {...props} />
					<CompiledReportCard {...props} />
				</div>
			</div>
		</AppLayout>
	);
}