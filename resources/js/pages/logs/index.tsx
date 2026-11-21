import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Download as DownloadIcon } from 'lucide-react';
import AppLayout from '@/layouts/app/app-layout';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import LogFilters from '@/components/logs/log-filters';
import LogTable from '@/components/logs/log-table';
import LogDetailsModal from '@/components/logs/log-details-modal';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LogFilterState, LogFilterOptions, LogType } from '@/components/logs/log-filters';
import type { LogTableColumn } from '@/components/logs/log-table';
import { formatIdentityLabel, formatKeywordLabel } from '@/lib/logs';

interface Props {
    logs: {
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    logType: string;
    logConfig: {
        title: string;
        description: string;
    };
    availableTypes: Array<{
        value: string;
        label: string;
    }>;
    filters: Record<string, any>;
    filterOptions?: LogFilterOptions;
}

/**
 * Folder-style tabs (same shell as the Student Work Management reference).
 * Applied through className only, so the shared <Tabs /> component stays untouched.
 *
 * - The active tab uses the same surface colour as the panel below it, so the two
 *   read as one piece.
 * - The two ::before / ::after squares draw the curved "shoulders" where the
 *   active tab flows into the panel.
 * - Inactive tabs are a darker blue-gray and overlap slightly.
 * - No margin, border or focus ring on the list/triggers, and the panel overlaps
 *   the list by 1px (-mt-px), so there is no visible seam between tab and panel.
 */
const TAB_LIST_CLASS =
    'relative z-20 flex h-10 w-full items-start justify-between gap-0 overflow-x-auto rounded-none border-0 bg-transparent p-0 md:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const TAB_TRIGGER_CLASS = [
    'relative h-[39px] min-w-[155px] data-[state=active]:h-10 flex-1 -ml-2 first:ml-0 rounded-t-xl rounded-b-none border-0 px-2 text-center text-sm font-medium',    'focus-visible:outline-none focus-visible:ring-0',
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
        // active = 30, neighbours = 29, next = 28 ... (never below 1)
        zIndex: Math.max(30 - distance, 1),
        shadeClass:
            distance === 0 ? '' : index < activeIndex ? SHADE_RIGHT_EDGE : SHADE_LEFT_EDGE,
    };
};

export default function LogsIndex({
    logs,
    logType,
    logConfig,
    availableTypes,
    filters: initialFilters,
    filterOptions = {}
}: Props) {
    const [filterState, setFilterState] = useState<LogFilterState>(initialFilters);
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

    useEffect(() => {
        setFilterState(initialFilters);
        setSelectedLogId(null);
    }, [logType, initialFilters]);

    const activeTabIndex = availableTypes.findIndex((type) => type.value === logType);

    const handleLogTypeChange = (nextLogType: string) => {
        if (nextLogType === logType) return;
        router.get(`/logs/${nextLogType}`);
    };

    // Map action types to user-friendly labels
    const getActionLabel = (actionType: string): string => {
        const actionMap: Record<string, string> = {
            // User Audit
            'create_user': 'Create User',
            'update_user': 'Update User',
            'deactivate_user': 'Deactivate User',
            // Faculty Audit
            'create_faculty': 'Create Faculty',
            'update_faculty': 'Update Faculty',
            'delete_faculty': 'Delete Faculty',
            // Research Entry
            'create_research_entry': 'Create Research Entry',
            'update_research_entry': 'Update Research Entry',
            'archive_research_entry': 'Archive Research Entry',
        };
        return actionMap[actionType] || actionType;
    };

    const handleFilterChange = (newFilters: LogFilterState) => {
        setFilterState(newFilters);
    };

    const handleApplyFilters = (appliedFilters: LogFilterState) => {
        const params = new URLSearchParams();

        // Date filters
        if (appliedFilters.datePreset && appliedFilters.datePreset !== 'custom') {
            params.append('date_preset', appliedFilters.datePreset);
        } else {
            if (appliedFilters.from) params.append('date_from', appliedFilters.from);
            if (appliedFilters.to) params.append('date_to', appliedFilters.to);
        }

        // Action filter - single selection only
        if (appliedFilters.actionType) {
            params.append('action', appliedFilters.actionType);
        }

        // Modified by filter (research-entry)
        if (appliedFilters.modifiedByUserId) {
            params.append('modified_by_user_id', String(appliedFilters.modifiedByUserId));
        }

        // Research filter (research-access)
        if (appliedFilters.researchSearch) {
            params.append('research_search', appliedFilters.researchSearch);
        }

        // Keyword filter (keyword-search)
        if (appliedFilters.keywordSearch) {
            params.append('keyword_search', appliedFilters.keywordSearch);
        }

        router.get(`/logs/${logType}?${params.toString()}`);
    };

    const getTableColumns = (): LogTableColumn<any>[] => {
        switch (logType) {
            case 'user-audit':
                return [
                    {
                        id: 'targetUser',
                        header: 'Target User',
                        cell: (row) => {
                            const targetUser = row.targetUser ?? (row.target_user_name ? { id: row.target_user_id, full_name: row.target_user_name } : null);
                            return formatIdentityLabel(targetUser, `ID: ${row.target_user_id}`);
                        },
                    },
                    { id: 'action_type', header: 'Action', cell: (row) => getActionLabel(row.action_type) },
                    {
                        id: 'modifiedBy',
                        header: 'Modified By',
                        cell: (row) => {
                            const modifiedByUser = row.modifiedByUser ?? (row.modified_by_user_name ? { id: row.modified_by, full_name: row.modified_by_user_name } : null);
                            return formatIdentityLabel(modifiedByUser, `ID: ${row.modified_by}`);
                        },
                    },
                    { id: 'created_at', header: 'Date', sortable: true, cell: (row) => new Date(row.created_at).toLocaleString() },
                ];
            case 'faculty-audit':
                return [
                    {
                        id: 'targetFaculty',
                        header: 'Faculty',
                        cell: (row) => {
                            const targetFaculty = row.targetFaculty ?? (row.target_faculty_name ? { id: row.target_faculty_id, full_name: row.target_faculty_name } : null);
                            return formatIdentityLabel(targetFaculty, `ID: ${row.target_faculty_id}`);
                        },
                    },
                    { id: 'action_type', header: 'Action', cell: (row) => getActionLabel(row.action_type) },
                    {
                        id: 'modifiedBy',
                        header: 'Modified By',
                        cell: (row) => {
                            const modifiedByUser = row.modifiedByUser ?? (row.modified_by_user_name ? { id: row.modified_by, full_name: row.modified_by_user_name } : null);
                            return formatIdentityLabel(modifiedByUser, `ID: ${row.modified_by}`);
                        },
                    },
                    { id: 'created_at', header: 'Date', sortable: true, cell: (row) => new Date(row.created_at).toLocaleString() },
                ];
            case 'research-entry':
                return [
                    { id: 'targetResearch', header: 'Research', cell: (row) => row.targetResearch?.title || `ID: ${row.target_research_id}` },
                    { id: 'action_type', header: 'Action', cell: (row) => getActionLabel(row.action_type) },
                    {
                        id: 'modifiedBy',
                        header: 'Modified By',
                        cell: (row) => {
                            const modifiedByUser = row.modifiedByUser ?? (row.modified_by_user_name ? { id: row.modified_by, full_name: row.modified_by_user_name } : null);
                            return formatIdentityLabel(modifiedByUser, `ID: ${row.modified_by}`);
                        },
                    },
                    { id: 'created_at', header: 'Date', sortable: true, cell: (row) => new Date(row.created_at).toLocaleString() },
                ];
            case 'research-access':
                return [
                    { id: 'research', header: 'Research', cell: (row) => `ID: ${row.research_id}` },
                    {
                        id: 'user',
                        header: 'Accessed By',
                        cell: (row) => {
                            const user = row.user ?? (row.user_name ? { id: row.user_id, full_name: row.user_name } : null);
                            return formatIdentityLabel(user, `ID: ${row.user_id}`);
                        },
                    },
                    { id: 'created_at', header: 'Date', sortable: true, cell: (row) => new Date(row.created_at).toLocaleString() },
                ];
            case 'keyword-search':
                return [
                    { id: 'search_term', header: 'Search Term', cell: (row) => row.search_term || 'N/A' },
                    {
                        id: 'keyword',
                        header: 'Keyword',
                        cell: (row) => {
                            const keyword = row.keyword ?? (row.keyword_name ? { id: row.keyword_id, keyword_name: row.keyword_name } : null);
                            return formatKeywordLabel(keyword, `ID: ${row.keyword_id}`);
                        },
                    },
                    {
                        id: 'user',
                        header: 'Searched By',
                        cell: (row) => {
                            const user = row.user ?? (row.user_name ? { id: row.user_id, full_name: row.user_name } : null);
                            return formatIdentityLabel(user, `ID: ${row.user_id}`);
                        },
                    },
                    { id: 'created_at', header: 'Date', sortable: true, cell: (row) => new Date(row.created_at).toLocaleString() },
                ];
            case 'generated-reports':
                return [
                    { id: 'report_type', header: 'Report Type', cell: (row) => row.report_type_name ?? `ID: ${row.report_type_id}` },
                    { id: 'report_format', header: 'Format', cell: (row) => row.report_format_name ?? `ID: ${row.report_format_id}` },
                    {
                        id: 'generated_by',
                        header: 'Generated By',
                        cell: (row) => {
                            const user = row.generatedBy ?? (row.generated_by_name ? { id: row.generated_by, full_name: row.generated_by_name } : null)
                            return formatIdentityLabel(user, `ID: ${row.generated_by}`)
                        }
                    },
                    { id: 'generated_on', header: 'Generated On', sortable: true, cell: (row) => new Date(row.generated_on ?? row.created_at).toLocaleString() },
                ];
            default:
                return [];
        }
    };

    const tableActions = {
        onRowClick: (row: any) => setSelectedLogId(row.id),
        ...(logType === 'generated-reports' ? {
            renderRelated: (row: any) => {
                const fileAvailable = !!(row.file_exists || row.file_path)
                return fileAvailable ? (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/logs/${logType}/${row.id}/download`; }} aria-label="Download report">
                        <DownloadIcon className="size-4" />
                    </Button>
                ) : (
                    <span className="text-sm text-muted-foreground">Missing</span>
                )
            }
        } : {})
    }

    return (
        <AppLayout>
            <Head title={logConfig.title} />
            <LogDetailsModal
                logType={logType}
                logId={selectedLogId}
                onClose={() => setSelectedLogId(null)}
            />
            <div className="space-y-4">
                {/* Page header */}
                {/* [&>div]:mb-2 trims the Heading's built-in bottom margin so the tabs sit closer */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between [&>div]:mb-2">
                    <Heading
                        title="Activity Logs"
                        description="Monitor system activities and changes"
                    />
                </div>

                {/* Folder tabs + the panel they attach to.
                    --tab-surface is shared by the active tab, its shoulders and the panel. */}
                <div className="relative [--tab-surface:#ffffff] [--tab-shade:rgba(15,23,42,0.2)] dark:[--tab-surface:#0f172a] dark:[--tab-shade:rgba(0,0,0,0.45)]">
                    <Tabs value={logType} onValueChange={handleLogTypeChange} className="w-full">
                        <TabsList className={TAB_LIST_CLASS}>
                            {availableTypes.map((type, index) => {
                                const { zIndex, shadeClass } = getTabDepth(index, activeTabIndex);
                                return (
                                    <TabsTrigger
                                        key={type.value}
                                        value={type.value}
                                        className={`${TAB_TRIGGER_CLASS} ${shadeClass}`}
                                        style={{ zIndex, boxShadow: 'none' }}
                                    >
                                        {type.label}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>

                    {/* The tab row spans the full width, so the first and last tabs are flush with
                        the panel's left and right edges. Both top corners of the panel stay square
                        (whichever tab is active or inactive) so no wedge of background can show. */}
                    <div className="relative z-10 -mt-px rounded-b-[20px] rounded-t-none bg-[var(--tab-surface)] shadow-sm">
                        <div className="px-5 pb-5 pt-3 sm:p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <HeadingSmall
                                        title={logConfig.title}
                                        description={logConfig.description}
                                    />
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {logs.total} log {logs.total === 1 ? 'entry' : 'entries'} found
                                    </p>
                                </div>
                                <LogFilters
                                    logType={logType as LogType}
                                    value={filterState}
                                    onChange={handleFilterChange}
                                    onApply={handleApplyFilters}
                                    options={filterOptions}
                                    variant="popover"
                                />
                            </div>

                            {/* Logs Table */}
                            <div className="mt-5 min-w-0">
                                    <LogTable
                                        data={logs.data}
                                        columns={getTableColumns()}
                                        getRowId={(row) => row.id}
                                        actions={tableActions}
                                        pagination={{
                                            meta: {
                                                current_page: logs.current_page,
                                                last_page: logs.last_page,
                                                per_page: logs.per_page,
                                                total: logs.total,
                                            },
                                            onChange: (page) => {
                                                router.get(`/logs/${logType}`, { ...filterState, page });
                                            },
                                            hrefBuilder: (page) => `/logs/${logType}?page=${page}`,
                                        }}
                                        emptyMessage="No log entries found"
                                    />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}