import StatusBadge from '@/components/research/status-badge';
import { refreshCsrfToken } from '@/lib/csrf';
import ThematicDetails from '@/components/research/thematic-details';
import { CheckCircle, Download, FileText, XCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ResearchDetailsPayload {
    id: number;
    status: string | null;
    research_title: string;
    program: { id: number; name: string; code?: string | null } | null;
    completed_month: number | null;
    completed_year: number;
    research_abstract: string;
    research_manuscript: string | null;
    manuscript_unavailable?: boolean;
    panelists_unavailable?: boolean;
    adviser: { id: number; name: string | null } | null;
    researchers: Array<{ id: number; name: string }>;
    panelists: Array<{ id: number; name: string }>;
    keywords: Array<{ id: number; keyword_name: string }>;
    agendas: Array<{ id: number; name: string }>;
    sdgs: Array<{ id: number; name: string }>;
    srigs: Array<{ id: number; name: string }>;
    can_download_files: boolean;
    can_request_access?: boolean;
}

interface Props {
    id: number | null;
    onClose: () => void;
    searchTerm?: string;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const highlightText = (text: string, searchTerm?: string): React.ReactNode => {
    if (!searchTerm || !text) return text;
    const safe = escapeRegExp(searchTerm);
    try {
        const regex = new RegExp(`(${safe})`, 'gi');
        return text.split(regex).map((part, idx) =>
            part.toLowerCase() === searchTerm.toLowerCase() ? (
                <mark key={idx} className="rounded bg-yellow-200 px-0.5 font-medium text-gray-900">
                    {part}
                </mark>
            ) : (
                part
            ),
        );
    } catch {
        return text;
    }
};

const monthName = (m: number | null) => {
    if (!m) return '';
    return new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });
};

export default function ResearchDetailsModal({ id, onClose, searchTerm }: Props) {
    const [data, setData] = useState<ResearchDetailsPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requesting, setRequesting] = useState<'manuscript' | null>(null);
    const [requestMessage, setRequestMessage] = useState<string | null>(null);
    const firstFocusRef = useRef<HTMLHeadingElement>(null);
    const loggedRef = useRef<Record<number, number>>({}); // research_id -> timestamp

    const requestFile = async (fileType: 'manuscript') => {
        if (!data) return;

        if (!data.can_request_access) {
            window.location.href = '/auth/google';
            return;
        }

        setRequesting(fileType);
        setError(null);
        setRequestMessage(null);

        const token = await refreshCsrfToken();

        try {
            const response = await fetch(`/guest/research/${data.id}/request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({ file_type: fileType }),
                credentials: 'same-origin',
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.message || 'Unable to submit request');
            }

            setRequestMessage('Your manuscript request has been submitted.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to submit request');
        } finally {
            setRequesting(null);
        }
    };

    const downloadFile = (fileType: 'manuscript') => {
        if (!data) return;
        if (!data.can_download_files) {
            window.location.href = '/auth/google';
            return;
        }
        window.location.href = `/research/${data.id}/manuscript`;
    };

    // Fetch when id changes
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        setData(null);
        fetch(`/research/${id}/details`, { headers: { Accept: 'application/json' } })
            .then((r) => {
                if (!r.ok) throw new Error('Failed to load details');
                return r.json();
            })
            .then((json) => setData(json.data as ResearchDetailsPayload))
            .catch((e) => setError(e.message || 'Unable to load details'))
            .finally(() => setLoading(false));
    }, [id]);

    // Log access after 3-second dwell, once per research within 5 minutes
    useEffect(() => {
        if (!id) return;
        const now = Date.now();
        const last = loggedRef.current[id] ?? 0;
        if (now - last < 5 * 60 * 1000) return;
        const timer = setTimeout(() => {
            // Re-check to ensure the same research is still open
            const currentLast = loggedRef.current[id] ?? 0;
            if (Date.now() - currentLast < 5 * 60 * 1000) return;
            loggedRef.current[id] = Date.now();
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
            fetch('/api/research-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({ research_id: id, action: 'details_view' }),
                credentials: 'same-origin',
            }).catch(() => {
                // Silent fail; avoid blocking UI
            });
        }, 3000);
        return () => clearTimeout(timer);
    }, [id]);

    // Focus management
    useEffect(() => {
        if (id && firstFocusRef.current) {
            firstFocusRef.current.focus();
        }
    }, [id]);

    // ESC to close
    useEffect(() => {
        if (!id) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [id, onClose]);

    if (!id) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4 lg:items-center"
            role="dialog"
            aria-modal="true"
        >
            {/* Responsive, modern card container */}
            <div className="relative flex h-[100dvh] max-h-[96dvh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl ring-1 ring-black/5 sm:h-[92dvh] sm:w-[92vw] md:w-[90vw] lg:h-auto lg:max-h-[92vh] lg:w-[86vw] lg:rounded-2xl xl:w-[80vw] dark:bg-gray-900 dark:ring-white/10">
                <header className="border-b border-gray-100 px-5 py-4 md:px-8 md:py-6 dark:border-gray-800">
                    <h2
                        ref={firstFocusRef}
                        tabIndex={-1}
                        className="pr-14 text-xl leading-tight font-bold text-gray-900 sm:text-2xl md:text-3xl dark:text-gray-100"
                    >
                        {data ? data.research_title : 'Loading...'}
                    </h2>
                    {/* Accessible, tappable close button */}
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

                {/* Scrollable content area with consistent vertical rhythm */}
                <div className="overflow-y-auto px-5 pb-5 md:px-8 md:pb-8">
                    {loading && <p className="py-6 text-gray-500 dark:text-gray-400">Fetching details...</p>}
                    {error && <p className="py-6 text-red-600">{error}</p>}
                    {data && (
                        // Rhythm: 16–24px between groups; 8–12px within items
                        <div className="space-y-6 py-4 md:space-y-8 md:py-6">
                            {/* Meta: Program / Adviser / Completion Date / Status */}
                            <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Program
                                    </p>
                                    <p className="mt-1 text-base break-words text-gray-900 dark:text-gray-100">
                                        {data.program?.code ? `${data.program.code} – ${data.program.name}` : data.program?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Adviser
                                    </p>
                                    <p className="mt-1 text-base break-words text-gray-900 dark:text-gray-100">{data.adviser?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Completion Date
                                    </p>
                                    <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                                        {monthName(data.completed_month)} {data.completed_year}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Status
                                    </p>
                                    <StatusBadge status={data.status} className="mt-1" />
                                </div>
                            </section>

                            {/* Abstract */}
                            <section>
                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                    Abstract
                                </p>
                                <p className="mt-2 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-gray-700 md:text-base dark:text-gray-300">
                                    {highlightText(data.research_abstract, searchTerm)}
                                </p>
                            </section>

                            {/* Contributors */}
                            <section className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Researchers
                                    </p>
                                    <p className="mt-1 text-base break-words text-gray-900 dark:text-gray-100">
                                        {(() => {
                                            const names = data.researchers.map((r) => r.name).filter(Boolean);
                                            return names.length ? names.join(', ') : data.panelists_unavailable ? 'Not available' : 'None';
                                        })()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                        Panels
                                    </p>
                                    <p className="mt-1 text-base break-words text-gray-900 dark:text-gray-100">
                                        {(() => {
                                            const names = data.panelists.map((p) => p.name).filter(Boolean);
                                            return names.length ? names.join(', ') : 'None';
                                        })()}
                                    </p>
                                </div>
                            </section>

                            {/* Keywords */}
                            <section>
                                <p className="text-[11px] font-medium tracking-wider text-gray-500 uppercase md:text-xs dark:text-gray-400">
                                    Keywords
                                </p>
                                <p className="mt-1 text-base break-words text-gray-900 dark:text-gray-100">
                                    {(() => {
                                        const names = data.keywords.map((k) => k.keyword_name).filter(Boolean);
                                        return names.length ? names.join(', ') : 'None';
                                    })()}
                                </p>
                            </section>

                            <ThematicDetails agendas={data.agendas} sdgs={data.sdgs} srigs={data.srigs} />

                            {/* Documents: card-within-card */}
                            <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 md:p-6 dark:border-gray-800 dark:bg-gray-900/60">
                                <div className="flex items-center gap-2">
                                    <Download className="h-5 w-5 text-gray-700 md:h-6 md:w-6 dark:text-gray-300" />
                                    <h3 className="text-base font-semibold text-gray-900 md:text-lg dark:text-gray-100">Research Documents</h3>
                                </div>

                                <div className="space-y-3">
                                    {/* Manuscript Row */}
                                    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3 md:p-4 dark:border-gray-700 dark:bg-gray-800">
                                        <div className="flex min-w-0 items-start gap-3 md:gap-4">
                                            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-600 md:h-6 md:w-6 dark:text-gray-300" />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900 md:text-base dark:text-gray-100">
                                                    Research Manuscript
                                                </p>
                                                <p className="text-xs text-gray-600 md:text-sm dark:text-gray-400">Full research paper</p>
                                            </div>
                                        </div>
                                        {data.research_manuscript ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (data.can_download_files) {
                                                        downloadFile('manuscript');
                                                        return;
                                                    }

                                                    if (data.can_request_access) {
                                                        void requestFile('manuscript');
                                                        return;
                                                    }

                                                    window.location.href = '/auth/google';
                                                }}
                                                aria-label={
                                                    data.can_download_files
                                                        ? 'Download Research Manuscript'
                                                        : data.can_request_access
                                                          ? 'Request Research Manuscript'
                                                          : 'Sign in with Google to request Research Manuscript'
                                                }
                                                title={
                                                    data.can_download_files
                                                        ? 'Download Research Manuscript'
                                                        : data.can_request_access
                                                          ? 'Request Research Manuscript'
                                                          : 'Sign in with Google to request Research Manuscript'
                                                }
                                                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:bg-blue-800 md:px-4 md:py-2.5"
                                            >
                                                <Download className="h-4 w-4" />
                                                {data.can_download_files
                                                    ? 'Download'
                                                    : data.can_request_access
                                                      ? requesting === 'manuscript'
                                                        ? 'Requesting...'
                                                        : 'Request Access'
                                                      : 'Sign in to request'}
                                            </button>
                                        ) : (
                                            <span className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500 select-none md:px-4 md:py-2.5 dark:bg-gray-800 dark:text-gray-400">
                                                <Download className="h-4 w-4" />
                                                {data.manuscript_unavailable ? 'Not available' : 'Not provided'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {requestMessage && (
                                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                                        {requestMessage}
                                    </div>
                                )}

                                {/* Availability status */}
                                <div>
                                    {data.research_manuscript ? (
                                        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-white p-2.5 md:p-3 dark:border-green-800 dark:bg-gray-900">
                                            <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                                            <div className="text-sm">
                                                <p className="font-medium text-green-700 dark:text-green-400">Documents Available</p>
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    {data.can_download_files
                                                        ? 'You can download the available documents above.'
                                                        : data.can_request_access
                                                          ? 'Sign in to request access to the available documents above.'
                                                          : 'Please sign in with Google to request access to these documents.'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2 rounded-md border border-orange-200 bg-white p-2.5 md:p-3 dark:border-orange-800 dark:bg-gray-900">
                                            <XCircle className="mt-0.5 h-5 w-5 text-orange-600" />
                                            <div className="text-sm">
                                                <p className="font-medium text-orange-700 dark:text-orange-400">No Documents Available</p>
                                                <p className="text-gray-700 dark:text-gray-300">This research has no downloadable documents yet.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
