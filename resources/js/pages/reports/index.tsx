import Heading from '@/components/heading';
import CompiledReportCard from '@/components/reports/compiled-report-card';
import MatrixReportCard from '@/components/reports/matrix-report-card';
import ResearchAlignmentCard from '@/components/reports/research-alignment-card';
import UsageReportsCard from '@/components/reports/usage-reports-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app/app-layout';
import type { ReportCardProps } from '@/types/reports';
import { Head } from '@inertiajs/react';

export default function ResearchMatrixIndex(props: ReportCardProps) {
    return (
        <AppLayout>
            <Head title="Reports & Analytics" />

            <div className="space-y-6 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading title="Reports & Analytics" description="View compiled and matrix reports for research performance." />
                </div>

                <Tabs defaultValue="research-records" className="space-y-6">
                    <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
                        <TabsTrigger value="research-records">Research Records</TabsTrigger>
                        <TabsTrigger value="compiled-reports">Compiled Reports</TabsTrigger>
                        <TabsTrigger value="research-alignment">Research Alignment</TabsTrigger>
                        <TabsTrigger value="usage-records">Usage Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="research-records">
                        <MatrixReportCard {...props} />
                    </TabsContent>

                    <TabsContent value="compiled-reports">
                        <CompiledReportCard {...props} />
                    </TabsContent>

                    <TabsContent value="research-alignment">
                        <ResearchAlignmentCard {...props} />
                    </TabsContent>
                    <TabsContent value="usage-records">
                        <UsageReportsCard programs={props.programs} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
