import Heading from '@/components/heading';
import CompiledReportCard from '@/components/reports/compiled-report-card';
import MatrixReportCard from '@/components/reports/matrix-report-card';
import ResearchAlignmentCard from '@/components/reports/research-alignment-card';
import UsageReportsCard from '@/components/reports/usage-reports-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app/app-layout';
import type { ReportCardProps } from '@/types/reports';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

const REPORT_TABS = [
    { value: 'research-records', label: 'Research Records' },
    { value: 'compiled-reports', label: 'Compiled Reports' },
    { value: 'research-alignment', label: 'Research Alignment' },
    { value: 'usage-records', label: 'Usage Reports' },
] as const;
type ReportTab = (typeof REPORT_TABS)[number]['value'];

const isReportTab = (value: string): value is ReportTab => REPORT_TABS.some((tab) => tab.value === value);

const TAB_LIST_CLASS =
    'relative z-20 flex h-10 w-full items-start justify-between gap-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 md:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const TAB_TRIGGER_CLASS = [
    'relative h-[39px] min-w-[155px] flex-1 -ml-2 first:ml-0 rounded-t-xl rounded-b-none border-0 px-2 text-center text-sm font-medium data-[state=active]:h-10',
    'focus-visible:outline-none focus-visible:ring-0',
    'bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
    'data-[state=active]:border-transparent data-[state=active]:bg-[var(--tab-surface)] data-[state=active]:text-slate-900 dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-[var(--tab-surface)] dark:data-[state=active]:text-white',
    "data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:-left-3 data-[state=active]:before:h-3 data-[state=active]:before:w-3 data-[state=active]:before:content-[''] data-[state=active]:before:bg-[radial-gradient(circle_at_0_0,transparent_12px,var(--tab-surface)_12px)] data-[state=active]:first:before:hidden",
    "data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:-right-3 data-[state=active]:after:h-3 data-[state=active]:after:w-3 data-[state=active]:after:content-[''] data-[state=active]:after:bg-[radial-gradient(circle_at_100%_0,transparent_12px,var(--tab-surface)_12px)] data-[state=active]:last:after:hidden",
].join(' ');

const SHADE_BASE =
    "before:pointer-events-none before:absolute before:inset-y-0 before:w-4 before:content-[''] before:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,transparent_10px,black_30px)] before:[mask-image:linear-gradient(to_bottom,transparent_0,transparent_10px,black_30px)]";
const SHADE_RIGHT_EDGE = `${SHADE_BASE} before:right-0 before:bg-[linear-gradient(to_left,var(--tab-shade),transparent)]`;
const SHADE_LEFT_EDGE = `${SHADE_BASE} before:left-0 before:bg-[linear-gradient(to_right,var(--tab-shade),transparent)]`;

const getTabDepth = (index: number, activeIndex: number) => {
    const distance = Math.abs(index - activeIndex);

    return {
        zIndex: Math.max(30 - distance, 1),
        shadeClass: distance === 0 ? '' : index < activeIndex ? SHADE_RIGHT_EDGE : SHADE_LEFT_EDGE,
    };
};

export default function ResearchMatrixIndex(props: ReportCardProps) {
    const [activeTab, setActiveTab] = useState<ReportTab>('research-records');
    const activeTabIndex = REPORT_TABS.findIndex((tab) => tab.value === activeTab);

    return (
        <AppLayout>
            <Head title="Reports & Analytics" />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading title="Reports & Analytics" description="View compiled and matrix reports for research performance." />
                </div>

                <div className="relative [--tab-shade:rgba(15,23,42,0.2)] [--tab-surface:#ffffff] dark:[--tab-shade:rgba(0,0,0,0.45)] dark:[--tab-surface:#0f172a]">
                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => {
                            if (isReportTab(value)) setActiveTab(value);
                        }}
                        className="w-full"
                    >
                        <TabsList className={TAB_LIST_CLASS}>
                            {REPORT_TABS.map((tab, index) => {
                                const { zIndex, shadeClass } = getTabDepth(index, activeTabIndex);

                                return (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className={`${TAB_TRIGGER_CLASS} ${shadeClass}`}
                                        style={{ zIndex, boxShadow: 'none' }}
                                    >
                                        {tab.label}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        <div className="relative z-10 -mt-px rounded-t-none rounded-b-[20px] bg-[var(--tab-surface)] p-4 shadow-sm sm:p-6">
                            <TabsContent value="research-records" className="m-0">
                                <MatrixReportCard {...props} />
                            </TabsContent>

                            <TabsContent value="compiled-reports" className="m-0">
                                <CompiledReportCard {...props} />
                            </TabsContent>

                            <TabsContent value="research-alignment" className="m-0">
                                <ResearchAlignmentCard {...props} />
                            </TabsContent>
                            <TabsContent value="usage-records" className="m-0">
                                <UsageReportsCard programs={props.programs} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
