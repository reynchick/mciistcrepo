import AppLayout from '@/layouts/app/app-layout';
import { Head } from '@inertiajs/react';
import MatrixReportCard from '@/components/reports/matrix-report-card';
import CompiledReportCard from '@/components/reports/compiled-report-card';
import type { ReportCardProps } from '@/types/reports';

export default function ResearchMatrixIndex(props: ReportCardProps) {
	return (
		<AppLayout title="Reports & Analytics">
			<Head title="Reports & Analytics" />

			<div className="space-y-6">
				<MatrixReportCard {...props} />
				<CompiledReportCard {...props} />
			</div>
		</AppLayout>
	);
}