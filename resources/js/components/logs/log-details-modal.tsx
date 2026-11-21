import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIdentityLabel, formatKeywordLabel, formatResearcherNames } from '@/lib/logs';
import { isEqual } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';

interface LogDetailsPayload {
    id: number;
    log_type: string;
    action_type?: string;
    modified_by?: number;
    modified_by_user?: {
        id: number;
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
    } | null;
    target_user_id?: number;
    target_user?: {
        id: number;
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
    } | null;
    target_faculty_id?: number;
    target_faculty?: {
        id: number;
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
    } | null;
    target_research_id?: number;
    target_research?: {
        id: number;
        title: string;
        completed_year: number;
        researchers?: Array<{ first_name?: string; middle_name?: string | null; last_name?: string }>;
    } | null;
    research_title?: string | null;
    researcher_names?: string | null;
    user_id?: number;
    user?: {
        id: number;
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
    } | null;
    research_id?: number;
    research?: {
        id: number;
        title: string;
        completed_year: number;
    } | null;
    keyword_id?: number;
    keyword?: {
        id: number;
        keyword_name: string;
    } | null;
    search_term?: string;
    report_type_id?: number;
    report_type?: {
        id: number;
        name: string;
    } | null;
    report_type_name?: string | null;
    report_format_id?: number;
    report_format?: {
        id: number;
        name: string;
    } | null;
    report_format_name?: string | null;
    generated_by?: number;
    generated_by_name?: string | null;
    generatedBy?: {
        id: number;
        full_name?: string;
        name?: string;
        email?: string;
    } | null;
    filters_applied?: Record<string, any> | any[] | string | null;
    filters_applied_display?: string | null;
    file_path?: string | null;
    file_exists?: boolean;
    ip_address?: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

interface Props {
    logType: string;
    logId: number | null;
    onClose: () => void;
}

const getActionLabel = (actionType: string): string => {
    const actionMap: Record<string, string> = {
        create_user: 'Create User',
        update_user: 'Update User',
        deactivate_user: 'Deactivate User',
        create_faculty: 'Create Faculty',
        update_faculty: 'Update Faculty',
        delete_faculty: 'Delete Faculty',
        create_research_entry: 'Create Research Entry',
        update_research_entry: 'Update Research Entry',
        archive_research_entry: 'Archive Research Entry',
        post_research_entry: 'Post',
        restore_research_entry: 'Restore Research Entry',
        request_adviser_metadata: 'Request Adviser Metadata',
        hard_delete_research_entry: 'Hard Delete Research Entry',
        change_status_research_entry: 'Change Status',
    };
    return actionMap[actionType] || actionType;
};

const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
        return <span className="text-gray-400 italic">None</span>;
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <span className="text-gray-400 italic">Empty</span>;
        }
        return (
            <ul className="list-inside list-disc space-y-1">
                {value.map((item, index) => (
                    <li key={index}>{formatValue(item)}</li>
                ))}
            </ul>
        );
    }

    if (typeof value === 'object') {
        return (
            <div className="space-y-1">
                {Object.entries(value).map(([key, val]) => (
                    <div key={key} className="text-sm">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                        <span>{formatValue(val)}</span>
                    </div>
                ))}
            </div>
        );
    }

    // Check if it's a date string
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        try {
            return new Date(value).toLocaleString();
        } catch {
            return value;
        }
    }

    return String(value);
};

const normalizeChangeValue = (value: any): any => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0 || trimmed.toLowerCase() === 'none') {
            return null;
        }
        return trimmed;
    }

    if (Array.isArray(value)) {
        const normalizedItems = value
            .map((item) => normalizeChangeValue(item))
            .filter((item) => {
                if (item === null || item === undefined) {
                    return false;
                }

                if (typeof item === 'string' && item.trim() === '') {
                    return false;
                }

                if (Array.isArray(item) && item.length === 0) {
                    return false;
                }

                if (typeof item === 'object' && item !== null && Object.keys(item).length === 0) {
                    return false;
                }

                return true;
            });

        return normalizedItems;
    }

    if (typeof value === 'object') {
        const normalizedEntries = Object.entries(value).reduce<Record<string, any>>((acc, [key, entryValue]) => {
            const normalizedEntry = normalizeChangeValue(entryValue);
            if (normalizedEntry === null || normalizedEntry === undefined) {
                return acc;
            }

            if (typeof normalizedEntry === 'string' && normalizedEntry.trim() === '') {
                return acc;
            }

            if (Array.isArray(normalizedEntry) && normalizedEntry.length === 0) {
                return acc;
            }

            if (typeof normalizedEntry === 'object' && normalizedEntry !== null && Object.keys(normalizedEntry).length === 0) {
                return acc;
            }

            acc[key] = normalizedEntry;
            return acc;
        }, {});

        return Object.keys(normalizedEntries).length > 0 ? normalizedEntries : null;
    }

    return value;
};

const hasMeaningfulDifference = (oldValue: any, newValue: any) => {
    const normalizedOldValue = normalizeChangeValue(oldValue);
    const normalizedNewValue = normalizeChangeValue(newValue);

    if (normalizedOldValue === null || normalizedNewValue === null) {
        return normalizedOldValue !== normalizedNewValue;
    }

    return !isEqual(normalizedOldValue, normalizedNewValue);
};

const getChangedFields = (oldValues?: Record<string, any>, newValues?: Record<string, any>) => {
    if (!oldValues && !newValues) return [];

    const keys = new Set<string>([...Object.keys(oldValues ?? {}), ...Object.keys(newValues ?? {})]);

    return Array.from(keys).filter((key) => {
        const oldValue = oldValues?.[key];
        const newValue = newValues?.[key];

        if (oldValue === undefined && newValue === undefined) {
            return false;
        }

        return hasMeaningfulDifference(oldValue, newValue);
    });
};

const renderFieldComparison = (fieldName: string, oldValue: any, newValue: any) => {
    const displayName = fieldName
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <div key={fieldName} className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-[140px] text-sm font-semibold text-gray-700 dark:text-gray-300">{displayName}</div>
                <div className="flex flex-1 items-center gap-4">
                    <div className="flex-1 rounded-lg bg-red-50/50 px-4 py-2.5 text-sm text-gray-700 dark:bg-red-900/10 dark:text-gray-300">
                        {formatValue(oldValue)}
                    </div>
                    <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </div>
                    <div className="flex-1 rounded-lg bg-green-50/50 px-4 py-2.5 text-sm text-gray-700 dark:bg-green-900/10 dark:text-gray-300">
                        {formatValue(newValue)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function LogDetailsModal({ logType, logId, onClose }: Props) {
    const [data, setData] = useState<LogDetailsPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const firstFocusRef = useRef<HTMLHeadingElement>(null);

    // Fetch log details when logId changes
    useEffect(() => {
        if (!logId) return;
        setLoading(true);
        setError(null);
        setData(null);
        fetch(`/logs/${logType}/${logId}/details`, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => {
                if (!r.ok) throw new Error('Failed to load log details');
                return r.json();
            })
            .then((json) => setData(json.data as LogDetailsPayload))
            .catch((e) => setError(e.message || 'Unable to load log details'))
            .finally(() => setLoading(false));
    }, [logId, logType]);

    // Focus management
    useEffect(() => {
        if (logId && firstFocusRef.current) {
            firstFocusRef.current.focus();
        }
    }, [logId]);

    // ESC to close
    useEffect(() => {
        if (!logId) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [logId, onClose]);

    if (!logId) return null;

    const getModalTitle = () => {
        if (!data) return 'Loading...';
        switch (logType) {
            case 'user-audit':
                return 'User Audit Log Details';
            case 'faculty-audit':
                return 'Faculty Audit Log Details';
            case 'research-entry':
                return 'Research Entry Log Details';
            case 'research-access':
                return 'Research Access Log Details';
            case 'keyword-search':
                return 'Keyword Search Log Details';
            case 'generated-reports':
                return 'Generated Reports Log Details';
            default:
                return 'Log Details';
        }
    };

    const researchTitle = (data as any)?.research_title ?? data?.target_research?.title ?? data?.research?.title ?? null;

    const researcherSummary = (data as any)?.researcher_names ?? formatResearcherNames((data as any)?.target_research?.researchers ?? []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4 lg:items-center"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            {/* Modal container */}
            <div
                className="relative flex h-[100dvh] max-h-[96dvh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl ring-1 ring-black/5 sm:h-[92dvh] sm:w-[92vw] md:w-[90vw] lg:h-auto lg:max-h-[92vh] lg:w-[70vw] lg:rounded-2xl xl:w-[60vw] dark:bg-gray-900 dark:ring-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="border-b border-gray-100 px-5 py-4 md:px-8 md:py-6 dark:border-gray-800">
                    <h2
                        ref={firstFocusRef}
                        tabIndex={-1}
                        className="pr-14 text-xl leading-tight font-bold text-gray-900 sm:text-2xl md:text-3xl dark:text-gray-100"
                    >
                        {getModalTitle()}
                    </h2>
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-gray-200 md:top-4 md:right-4 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 dark:focus-visible:ring-offset-gray-900 dark:active:bg-gray-700"
                        aria-label="Close details"
                        title="Close"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                {/* Scrollable content area */}
                <div className="overflow-y-auto px-5 pb-5 md:px-8 md:pb-8">
                    {loading && (
                        <div className="space-y-4 py-6">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    )}
                    {error && <p className="py-6 text-red-600 dark:text-red-400">{error}</p>}
                    {data && (
                        <div className="space-y-6 py-4 md:space-y-8 md:py-6">
                            {/* Common Fields */}
                            <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Log ID
                                    </p>
                                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{data.id}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Date & Time
                                    </p>
                                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{new Date(data.created_at).toLocaleString()}</p>
                                </div>
                                {data.ip_address && (
                                    <div>
                                        <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                            IP Address
                                        </p>
                                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{data.ip_address}</p>
                                    </div>
                                )}
                            </section>

                            {/* User Audit Log Specific */}
                            {logType === 'user-audit' && (
                                <>
                                    <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                        {data.action_type && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Action Type
                                                </p>
                                                <Badge className="mt-1">{getActionLabel(data.action_type)}</Badge>
                                            </div>
                                        )}
                                        {data.modified_by_user && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Modified By
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                                    {formatIdentityLabel(data.modified_by_user)}
                                                </p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{data.modified_by_user.email}</p>
                                            </div>
                                        )}
                                        {data.target_user && (
                                            <div className="lg:col-span-2">
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Target User
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                                    {formatIdentityLabel(data.target_user)}
                                                </p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{data.target_user.email}</p>
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}

                            {/* Faculty Audit Log Specific */}
                            {logType === 'faculty-audit' && (
                                <>
                                    <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                        {data.action_type && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Action Type
                                                </p>
                                                <Badge className="mt-1">{getActionLabel(data.action_type)}</Badge>
                                            </div>
                                        )}
                                        {data.modified_by_user && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Modified By
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                                    {formatIdentityLabel(data.modified_by_user)}
                                                </p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{data.modified_by_user.email}</p>
                                            </div>
                                        )}
                                        {data.target_faculty && (
                                            <div className="lg:col-span-2">
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Target Faculty
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                                    {formatIdentityLabel(data.target_faculty)}
                                                </p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{data.target_faculty.email}</p>
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}

                            {/* Research Entry Log Specific */}
                            {logType === 'research-entry' && (
                                <>
                                    <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                        {data.action_type && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Action Type
                                                </p>
                                                <Badge className="mt-1">{getActionLabel(data.action_type)}</Badge>
                                            </div>
                                        )}
                                        {data.modified_by_user && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Modified By
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                                    {formatIdentityLabel(data.modified_by_user)}
                                                </p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{data.modified_by_user.email}</p>
                                            </div>
                                        )}
                                        {data.target_research && (
                                            <div className="space-y-2 lg:col-span-2">
                                                <div>
                                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                        Target Research
                                                    </p>
                                                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                                        {researchTitle || data.target_research.title}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                        Researchers
                                                    </p>
                                                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{researcherSummary}</p>
                                                </div>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                                    Completion: {data.target_research.completed_year ?? 'N/A'}
                                                </p>
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}

                            {/* Research Access Log Specific */}
                            {logType === 'research-access' && (
                                <>
                                    <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                        {data.user && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Accessed By
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{formatIdentityLabel(data.user)}</p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{data.user.email}</p>
                                            </div>
                                        )}
                                        {data.research && (
                                            <div className="lg:col-span-2">
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Research
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                                    {(data as any).research_title || data.research.title}
                                                </p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                                    Completion: {data.research.completed_year ?? 'N/A'}
                                                </p>
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}

                            {/* Keyword Search Log Specific */}
                            {logType === 'keyword-search' && (
                                <>
                                    <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                        {data.search_term && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Search Term
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{data.search_term}</p>
                                            </div>
                                        )}
                                        {data.keyword && (
                                            <div>
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Matched Keyword
                                                </p>
                                                <Badge className="mt-1">{formatKeywordLabel(data.keyword)}</Badge>
                                            </div>
                                        )}
                                        {data.user && (
                                            <div className="lg:col-span-2">
                                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                    Searched By
                                                </p>
                                                <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{formatIdentityLabel(data.user)}</p>
                                                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{data.user.email}</p>
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}

                            {logType === 'generated-reports' && (
                                <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                    <div>
                                        <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                            Report Type
                                        </p>
                                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                            {data.report_type_name ?? data.report_type?.name ?? `ID: ${data.report_type_id ?? 'N/A'}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                            Report Format
                                        </p>
                                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                            {data.report_format_name ?? data.report_format?.name ?? `ID: ${data.report_format_id ?? 'N/A'}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                            Generated By
                                        </p>
                                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                            {data.generated_by_name ??
                                                data.generatedBy?.full_name ??
                                                data.generatedBy?.name ??
                                                `ID: ${data.generated_by ?? 'N/A'}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                            File Status
                                        </p>
                                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                            {data.file_exists ? 'Available' : 'Missing'}
                                        </p>
                                    </div>
                                    {data.file_path && (
                                        <div className="lg:col-span-2">
                                            <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                File Path
                                            </p>
                                            <p className="mt-1 text-base break-all text-gray-900 dark:text-gray-100">{data.file_path}</p>
                                        </div>
                                    )}
                                    {(data.filters_applied || data.filters_applied_display) && (
                                        <div className="lg:col-span-2">
                                            <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                                Filters Applied
                                            </p>
                                            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm break-words whitespace-pre-wrap text-gray-700 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                                                {typeof data.filters_applied === 'string'
                                                    ? data.filters_applied
                                                    : (data.filters_applied_display ?? JSON.stringify(data.filters_applied, null, 2))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* Change Details (for update actions) */}
                            {(() => {
                                const changedFields = getChangedFields(data.old_values, data.new_values);
                                return changedFields.length > 0 ? (
                                    <section>
                                        <p className="mb-4 text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                            Changes Made
                                        </p>
                                        <div className="space-y-1">
                                            {changedFields.map((fieldName) =>
                                                renderFieldComparison(fieldName, data.old_values?.[fieldName], data.new_values?.[fieldName]),
                                            )}
                                        </div>
                                    </section>
                                ) : null;
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
