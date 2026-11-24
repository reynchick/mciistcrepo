import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIdentityLabel, formatKeywordLabel, formatResearcherNames } from '@/lib/logs';
import { isEqual } from 'lodash';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

type PersonLike = { first_name: string; middle_name?: string; last_name: string; email: string } | null | undefined;
type SectionKey = 'overview' | 'people' | 'details' | 'changes';

// Finds a related user in the payload no matter how the backend named the key
// (snake_case, camelCase, or a relation that replaced the numeric id column).
const pickPerson = (source: any, keys: string[]): any => {
    for (const key of keys) {
        const value = source?.[key];
        if (value && typeof value === 'object') return value;
    }
    return null;
};

// Display name for a person object, even if it only has full_name / name
const personName = (person: any): string | null => {
    if (!person) return null;
    if (person.first_name || person.last_name) return formatIdentityLabel(person);
    return person.full_name ?? person.name ?? null;
};

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

// ---------------------------------------------------------------------------
// Building blocks (same look as the "Account Setup" reference card)
// ---------------------------------------------------------------------------

/** One row inside a section: muted label + value */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 px-3.5 py-2.5">
            <span className="w-36 shrink-0 text-sm text-slate-500 dark:text-slate-400">{label}</span>
            <div className="min-w-0 flex-1 text-sm leading-snug font-medium break-words text-slate-900 dark:text-slate-100">{children}</div>
        </div>
    );
}

/** Bordered list that holds the rows */
function RowList({ children }: { children: React.ReactNode }) {
    return <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">{children}</div>;
}

/** Status pill: soft gray, cobalt blue only for the open Changes section. Text is centered in the box. */
function StatusPill({ active, children }: { active: boolean; children: React.ReactNode }) {
    return (
        <span
            className={`inline-flex h-8 items-center justify-center rounded-full px-4 text-center text-xs leading-none font-medium whitespace-nowrap ${
                active ? 'bg-[#0047AB] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
        >
            {children}
        </span>
    );
}

export default function LogDetailsModal({ logType, logId, onClose }: Props) {
    const [data, setData] = useState<LogDetailsPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [changesOpen, setChangesOpen] = useState(false);
    const firstFocusRef = useRef<HTMLHeadingElement>(null);

    // Fetch log details when logId changes
    useEffect(() => {
        if (!logId) return;
        setLoading(true);
        setError(null);
        setData(null);
        setChangesOpen(false);
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

    const changedFields = data ? getChangedFields(data.old_values, data.new_values) : [];

    // Who did it
    const actorPerson: PersonLike = pickPerson(data, [
        'modified_by_user',
        'modifiedByUser',
        'modifiedBy',
        'modified_by', // when the relation overwrote the numeric id column
        'user',
        'actor',
    ]);
    const actorFallbackName =
        (data as any)?.modified_by_name ?? data?.generated_by_name ?? data?.generatedBy?.full_name ?? data?.generatedBy?.name ?? null;
    const actorName = personName(actorPerson) ?? (actorFallbackName ?? 'System');
    const actorEmail = actorPerson?.email ?? data?.generatedBy?.email ?? null;
    const actorLabel =
        logType === 'research-access' ? 'Accessed by' : logType === 'keyword-search' ? 'Searched by' : logType === 'generated-reports' ? 'Generated by' : 'Modified by';

    const targetUser: PersonLike = pickPerson(data, ['target_user', 'targetUser']);
    const targetFaculty: PersonLike = pickPerson(data, ['target_faculty', 'targetFaculty']);
    const target = targetUser ?? targetFaculty;
    const targetName = personName(target);
    const targetLabel = logType === 'faculty-audit' ? 'Target Faculty' : 'Target User';
    const primaryTitle = data?.action_type ? getActionLabel(data.action_type) : getModalTitle().replace(' Log Details', '');

    const summaryText = (() => {
        if (!data) return '';
        switch (logType) {
            case 'user-audit':
            case 'faculty-audit':
                return `${actorName} performed "${primaryTitle}"${targetName ? ` on ${targetName}` : ''}.`;
            case 'research-entry':
                return `${actorName} performed "${primaryTitle}"${researchTitle ? ` on "${researchTitle}"` : ''}.`;
            case 'research-access':
                return `${actorName} opened ${researchTitle ? `"${researchTitle}"` : 'a research entry'}.`;
            case 'keyword-search':
                return `${actorName} searched for "${data.search_term ?? 'a keyword'}".`;
            case 'generated-reports':
                return `${actorName} generated a ${data.report_type_name ?? data.report_type?.name ?? 'report'}.`;
            default:
                return '';
        }
    })();

    // Accordion sections
    const hasDetails = ['research-entry', 'research-access', 'keyword-search', 'generated-reports'].includes(logType);
    const detailsLabel = logType === 'keyword-search' ? 'Search' : logType === 'generated-reports' ? 'Report' : 'Research';
    const peopleCount = 1 + (target ? 1 : 0);

    const sections: Array<{ key: SectionKey; title: string; pill: string }> = [
        {
            key: 'overview',
            title: 'Overview',
            pill: data?.action_type ? getActionLabel(data.action_type) : 'Recorded',
        },
        {
            key: 'people',
            title: 'People',
            pill: `${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`,
        },
        ...(hasDetails
            ? [
                  {
                      key: 'details' as SectionKey,
                      title: detailsLabel,
                      pill: logType === 'generated-reports' ? (data?.file_exists ? 'Available' : 'Missing') : 'Record',
                  },
              ]
            : []),
        {
            key: 'changes',
            title: 'Changes',
            pill: changedFields.length > 0 ? `${changedFields.length} changed` : 'None',
        },
    ];

    // Overview / People / details are always visible; only Changes collapses
    const staticSections = sections.filter((s) => s.key !== 'changes');
    const changesSection = sections.find((s) => s.key === 'changes')!;
    const hasChanges = changedFields.length > 0;
    const handlePrimary = () => (hasChanges ? setChangesOpen((v) => !v) : onClose());

    const renderSection = (key: SectionKey) => {
        if (!data) return null;

        if (key === 'overview') {
            return (
                <RowList>
                    <Row label="Activity Summary">
                        {summaryText}
                    </Row>
                    <Row label="Log ID">
                        #{data.id}
                    </Row>
                    <Row label="Date & Time">
                        {new Date(data.created_at).toLocaleString()}
                    </Row>
                    {data.ip_address && (
                        <Row label="IP Address">
                            {data.ip_address}
                        </Row>
                    )}
                    {data.action_type && (
                        <Row label="Action Type">
                            <Badge className="inline-flex h-7 items-center justify-center border-transparent bg-slate-100 px-3 text-center text-xs leading-none font-medium text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300">{getActionLabel(data.action_type)}</Badge>
                        </Row>
                    )}
                </RowList>
            );
        }

        if (key === 'people') {
            return (
                <RowList>
                    <Row label={actorLabel}>
                        {actorName}
                    </Row>
                    {actorEmail && (
                        <Row label="Email">
                            {actorEmail}
                        </Row>
                    )}
                    {target && (
                        <>
                            <Row label={targetLabel}>
                                {targetName}
                            </Row>
                            {target.email && (
                                <Row label="Target Email">
                                    {target.email}
                                </Row>
                            )}
                        </>
                    )}
                </RowList>
            );
        }

        if (key === 'details') {
            if (logType === 'research-entry') {
                return (
                    <RowList>
                        <Row label="Title">
                            {researchTitle || data.target_research?.title || 'Untitled research'}
                        </Row>
                        <Row label="Researchers">
                            {researcherSummary || 'N/A'}
                        </Row>
                        <Row label="Completion">
                            {data.target_research?.completed_year ?? 'N/A'}
                        </Row>
                    </RowList>
                );
            }

            if (logType === 'research-access') {
                return (
                    <RowList>
                        <Row label="Title">
                            {(data as any).research_title || data.research?.title || 'Untitled research'}
                        </Row>
                        <Row label="Completion">
                            {data.research?.completed_year ?? 'N/A'}
                        </Row>
                    </RowList>
                );
            }

            if (logType === 'keyword-search') {
                return (
                    <RowList>
                        <Row label="Search Term">
                            {data.search_term ?? 'N/A'}
                        </Row>
                        {data.keyword && (
                            <Row label="Matched Keyword">
                                <Badge>{formatKeywordLabel(data.keyword)}</Badge>
                            </Row>
                        )}
                    </RowList>
                );
            }

            if (logType === 'generated-reports') {
                return (
                    <RowList>
                        <Row label="Report Type">
                            {data.report_type_name ?? data.report_type?.name ?? `ID: ${data.report_type_id ?? 'N/A'}`}
                        </Row>
                        <Row label="Report Format">
                            {data.report_format_name ?? data.report_format?.name ?? `ID: ${data.report_format_id ?? 'N/A'}`}
                        </Row>
                        <Row label="Generated By">
                            {data.generated_by_name ?? data.generatedBy?.full_name ?? data.generatedBy?.name ?? `ID: ${data.generated_by ?? 'N/A'}`}
                        </Row>
                        <Row label="File Status">
                            <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                    data.file_exists
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                }`}
                            >
                                {data.file_exists ? 'Available' : 'Missing'}
                            </span>
                        </Row>
                        {data.file_path && (
                            <Row label="File Path">
                                <span className="break-all">{data.file_path}</span>
                            </Row>
                        )}
                        {(data.filters_applied || data.filters_applied_display) && (
                            <Row label="Filters">
                                <span className="whitespace-pre-wrap">
                                    {typeof data.filters_applied === 'string'
                                        ? data.filters_applied
                                        : (data.filters_applied_display ?? JSON.stringify(data.filters_applied, null, 2))}
                                </span>
                            </Row>
                        )}
                    </RowList>
                );
            }

            return null;
        }

        // changes
        if (changedFields.length === 0) {
            return (
                <RowList>
                    <p className="px-2 py-4 text-center text-[13px] text-slate-500 dark:text-slate-400">No field changes were recorded for this log.</p>
                </RowList>
            );
        }

        return (
            <div className="space-y-3">
                {changedFields.map((fieldName) => {
                    const displayName = fieldName
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    return (
                        <div key={fieldName}>
                            <p className="mb-1.5 px-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{displayName}</p>
                            <RowList>
                                <Row label="Previous Value">
                                    <div className="font-normal text-slate-600 dark:text-slate-300">{formatValue(data.old_values?.[fieldName])}</div>
                                </Row>
                                <Row label="Updated Value">
                                    <div>{formatValue(data.new_values?.[fieldName])}</div>
                                </Row>
                            </RowList>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            {/* Card */}
            <div
                className="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header: title + subtitle */}
                <header className="flex items-center gap-3 px-6 pt-5 pb-4">
                    <div className="min-w-0">
                        <h2 ref={firstFocusRef} tabIndex={-1} className="text-base leading-tight font-bold text-slate-900 focus:outline-none dark:text-white">
                            {getModalTitle()}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Review the details recorded for this log.</p>
                    </div>
                </header>

                <div className="mx-6 border-t border-slate-200 dark:border-slate-800" />

                {/* Content */}
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
                    {loading && (
                        <div className="space-y-4 py-3">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    )}
                    {error && <p className="py-6 text-red-600 dark:text-red-400">{error}</p>}

                    {data && (
                        <>
                            {/* Always-visible sections */}
                            {staticSections.map((s) => {
                                return (
                                    <section key={s.key}>
                                        <div className="mb-3 flex items-center gap-3">
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{s.title}</span>
                                            </span>
                                            <StatusPill active={false}>{s.pill}</StatusPill>
                                        </div>
                                        {renderSection(s.key)}
                                    </section>
                                );
                            })}

                            {/* Changes: the only dropdown */}
                            <section>
                                <button
                                    type="button"
                                    onClick={() => setChangesOpen((v) => !v)}
                                    aria-expanded={changesOpen}
                                    className="flex w-full items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{changesSection.title}</span>
                                    </span>
                                    <StatusPill active={changesOpen}>{changesSection.pill}</StatusPill>
                                    <span
                                        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                                            changesOpen
                                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                    >
                                        {changesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                    </span>
                                </button>
                                {changesOpen && <div className="mt-3">{renderSection('changes')}</div>}
                            </section>
                        </>
                    )}
                </div>

                {/* Footer: Close (outline) + primary (dark) */}
                <footer className="grid grid-cols-2 gap-3 px-6 pt-2 pb-5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-10 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handlePrimary}
                        disabled={!data}
                        className="h-10 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                        {hasChanges ? (changesOpen ? 'Hide changes' : 'View changes') : 'Done'}
                    </button>
                </footer>
            </div>
        </div>
    );
}