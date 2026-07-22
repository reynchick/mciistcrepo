import React, { useEffect, useRef, useState } from 'react';
import { isEqual } from 'lodash';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIdentityLabel, formatKeywordLabel, formatResearcherNames } from '@/lib/logs';

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
    published_year: number;
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
    published_year: number;
  } | null;
  keyword_id?: number;
  keyword?: {
    id: number;
    keyword_name: string;
  } | null;
  search_term?: string;
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
    'create_user': 'Create User',
    'update_user': 'Update User',
    'deactivate_user': 'Deactivate User',
    'create_faculty': 'Create Faculty',
    'update_faculty': 'Update Faculty',
    'delete_faculty': 'Delete Faculty',
    'create_research_entry': 'Create Research Entry',
    'update_research_entry': 'Update Research Entry',
    'archive_research_entry': 'Archive Research Entry',
    'submit_research_entry': 'Submit for Review',
    'return_research_entry': 'Return for Revision',
    'publish_research_entry': 'Publish',
    'restore_research_entry': 'Restore Research Entry',
    'request_adviser_metadata': 'Request Adviser Metadata',
    'hard_delete_research_entry': 'Hard Delete Research Entry',
    'change_status_research_entry': 'Change Status',
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
      <ul className="list-disc list-inside space-y-1">
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
    return false;
  }

  return !isEqual(normalizedOldValue, normalizedNewValue);
};

const getChangedFields = (oldValues?: Record<string, any>, newValues?: Record<string, any>) => {
  if (!oldValues && !newValues) return [];

  const keys = new Set<string>([
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ]);

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
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div key={fieldName} className="py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm min-w-[140px]">
          {displayName}
        </div>
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-red-50/50 dark:bg-red-900/10 px-4 py-2.5 rounded-lg">
            {formatValue(oldValue)}
          </div>
          <div className="text-gray-400 dark:text-gray-500 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-green-50/50 dark:bg-green-900/10 px-4 py-2.5 rounded-lg">
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
      default:
        return 'Log Details';
    }
  };

  const researchTitle = (data as any)?.research_title
    ?? data?.target_research?.title
    ?? data?.research?.title
    ?? null;

  const researcherSummary = (data as any)?.researcher_names
    ?? formatResearcherNames((data as any)?.target_research?.researchers ?? []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start lg:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Modal container */}
      <div
        className="relative bg-white dark:bg-gray-900 w-full sm:w-[92vw] md:w-[90vw] lg:w-[70vw] xl:w-[60vw] max-w-4xl rounded-xl lg:rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 h-[100dvh] sm:h-[92dvh] lg:h-auto max-h-[96dvh] lg:max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 dark:border-gray-800">
          <h2
            ref={firstFocusRef}
            tabIndex={-1}
            className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 pr-14"
          >
            {getModalTitle()}
          </h2>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex items-center justify-center h-10 w-10 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
            aria-label="Close details"
            title="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        {/* Scrollable content area */}
        <div className="px-5 pb-5 md:px-8 md:pb-8 overflow-y-auto">
          {loading && (
            <div className="py-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
          {error && (
            <p className="py-6 text-red-600 dark:text-red-400">{error}</p>
          )}
          {data && (
            <div className="space-y-6 md:space-y-8 py-4 md:py-6">
              {/* Common Fields */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                    Log ID
                  </p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {data.id}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                    Date & Time
                  </p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {new Date(data.created_at).toLocaleString()}
                  </p>
                </div>
                {data.ip_address && (
                  <div>
                    <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                      IP Address
                    </p>
                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                      {data.ip_address}
                    </p>
                  </div>
                )}
              </section>

              {/* User Audit Log Specific */}
              {logType === 'user-audit' && (
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    {data.action_type && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Action Type
                        </p>
                        <Badge className="mt-1">
                          {getActionLabel(data.action_type)}
                        </Badge>
                      </div>
                    )}
                    {data.modified_by_user && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Modified By
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {formatIdentityLabel(data.modified_by_user)}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {data.modified_by_user.email}
                        </p>
                      </div>
                    )}
                    {data.target_user && (
                      <div className="lg:col-span-2">
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Target User
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {formatIdentityLabel(data.target_user)}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {data.target_user.email}
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Faculty Audit Log Specific */}
              {logType === 'faculty-audit' && (
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    {data.action_type && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Action Type
                        </p>
                        <Badge className="mt-1">
                          {getActionLabel(data.action_type)}
                        </Badge>
                      </div>
                    )}
                    {data.modified_by_user && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Modified By
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {formatIdentityLabel(data.modified_by_user)}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {data.modified_by_user.email}
                        </p>
                      </div>
                    )}
                    {data.target_faculty && (
                      <div className="lg:col-span-2">
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Target Faculty
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {formatIdentityLabel(data.target_faculty)}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {data.target_faculty.email}
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Research Entry Log Specific */}
              {logType === 'research-entry' && (
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    {data.action_type && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Action Type
                        </p>
                        <Badge className="mt-1">
                          {getActionLabel(data.action_type)}
                        </Badge>
                      </div>
                    )}
                    {data.modified_by_user && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Modified By
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {formatIdentityLabel(data.modified_by_user)}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {data.modified_by_user.email}
                        </p>
                      </div>
                    )}
                    {data.target_research && (
                      <div className="lg:col-span-2 space-y-2">
                        <div>
                          <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                            Target Research
                          </p>
                          <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                            {researchTitle || data.target_research.title}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                            Researchers
                          </p>
                          <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                            {researcherSummary}
                          </p>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          Completion: {data.target_research.published_year ?? 'N/A'}
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Research Access Log Specific */}
              {logType === 'research-access' && (
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    {data.user && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Accessed By
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {formatIdentityLabel(data.user)}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {data.user.email}
                        </p>
                      </div>
                    )}
                    {data.research && (
                      <div className="lg:col-span-2">
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Research
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {(data as any).research_title || data.research.title}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          Completion: {data.research.published_year ?? 'N/A'}
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Keyword Search Log Specific */}
              {logType === 'keyword-search' && (
                <>
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    {data.search_term && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Search Term
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {data.search_term}
                        </p>
                      </div>
                    )}
                    {data.keyword && (
                      <div>
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Matched Keyword
                        </p>
                        <Badge className="mt-1">
                          {formatKeywordLabel(data.keyword)}
                        </Badge>
                      </div>
                    )}
                    {data.user && (
                      <div className="lg:col-span-2">
                        <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                          Searched By
                        </p>
                        <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                          {formatIdentityLabel(data.user)}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                          {data.user.email}
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* Change Details (for update actions) */}
              {(() => {
                const changedFields = getChangedFields(data.old_values, data.new_values);
                return changedFields.length > 0 ? (
                  <section>
                    <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-4">
                      Changes Made
                    </p>
                    <div className="space-y-1">
                      {changedFields.map((fieldName) => 
                        renderFieldComparison(
                          fieldName,
                          data.old_values?.[fieldName],
                          data.new_values?.[fieldName]
                        )
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
