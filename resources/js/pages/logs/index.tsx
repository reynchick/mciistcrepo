import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Filter as FilterIcon } from 'lucide-react';
import AppLayout from '@/layouts/app/app-layout';
import Heading from '@/components/heading';
import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LogFilters from '@/components/logs/log-filters';
import LogTable from '@/components/logs/log-table';
import LogDetailsModal from '@/components/logs/log-details-modal';
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
    filters: Record<string, any>;
    filterOptions?: LogFilterOptions;
}

export default function LogsIndex({ 
    logs, 
    logType, 
    logConfig, 
    filters: initialFilters,
    filterOptions = {}
}: Props) {
    const [filterState, setFilterState] = useState<LogFilterState>(initialFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

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
                    { id: 'ip_address', header: 'IP Address', cell: (row) => row.ip_address || 'N/A' },
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
                    { id: 'ip_address', header: 'IP Address', cell: (row) => row.ip_address || 'N/A' },
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
                    { id: 'ip_address', header: 'IP Address', cell: (row) => row.ip_address || 'N/A' },
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
                    { id: 'ip_address', header: 'IP Address', cell: (row) => row.ip_address || 'N/A' },
                    { id: 'created_at', header: 'Date', sortable: true, cell: (row) => new Date(row.created_at).toLocaleString() },
                ];
            default:
                return [];
        }
    };

    return (
        <AppLayout>
            <Head title={logConfig.title} />
            <LogDetailsModal 
                logType={logType}
                logId={selectedLogId}
                onClose={() => setSelectedLogId(null)}
            />
            <div className="space-y-6 p-4 sm:p-6">
                {/* Header with toggleable filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading 
                        title="Activity Logs" 
                        description="Monitor system activities and changes" 
                    />
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => setShowFilters((open) => !open)}
                    >
                        <FilterIcon className="mr-2 h-4 w-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                </div>

                {/* Current Log Type Info */}
                <Card>
                    <CardHeader>
                        <HeadingSmall 
                            title={logConfig.title} 
                            description={logConfig.description} 
                        />
                    </CardHeader>
                </Card>

                {/* Filters and Table Layout */}
                <div className="flex flex-col gap-6 lg:flex-row">
                    {showFilters && (
                        <LogFilters 
                            logType={logType as LogType}
                            value={filterState}
                            onChange={handleFilterChange}
                            onApply={handleApplyFilters}
                            options={filterOptions}
                            className="lg:sticky lg:top-6 lg:self-start"
                        />
                    )}

                    {/* Logs Table */}
                    <div className="flex-1">
                        <Card>
                            <CardHeader>
                                <HeadingSmall 
                                    title="Log Entries" 
                                    description={`${logs.total} log entry(ies) found`} 
                                />
                            </CardHeader>
                            <CardContent>
                                <LogTable 
                                    data={logs.data}
                                    columns={getTableColumns()}
                                    getRowId={(row) => row.id}
                                    actions={{
                                        onRowClick: (row) => setSelectedLogId(row.id),
                                    }}
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
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}