import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, CheckCircle, XCircle } from 'lucide-react';

interface ResearchDetailsPayload {
  id: number;
  research_title: string;
  program: { id: number; name: string; code?: string | null } | null;
  published_month: number | null;
  published_year: number;
  research_abstract: string;
  research_approval_sheet: string | null;
  research_manuscript: string | null;
  adviser: { id: number; name: string | null } | null;
  researchers: Array<{ id: number; name: string }>;
  panelists: Array<{ id: number; name: string }>;
  keywords: Array<{ id: number; keyword_name: string }>;
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
        <mark key={idx} className="bg-yellow-200 text-gray-900 font-medium px-0.5 rounded">{part}</mark>
      ) : (
        part
      )
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
  const firstFocusRef = useRef<HTMLHeadingElement>(null);
  const loggedRef = useRef<Record<number, number>>({}); // research_id -> timestamp

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Fetch when id changes
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/research/${id}/details`, { headers: { Accept: 'application/json' } })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load details');
        return r.json();
      })
      .then(json => setData(json.data as ResearchDetailsPayload))
      .catch(e => setError(e.message || 'Unable to load details'))
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
          'Accept': 'application/json',
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
      className="fixed inset-0 z-50 flex items-start lg:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* Responsive, modern card container */}
      <div className="relative bg-white dark:bg-gray-900 w-full sm:w-[92vw] md:w-[90vw] lg:w-[86vw] xl:w-[80vw] max-w-6xl rounded-xl lg:rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 h-[100dvh] sm:h-[92dvh] lg:h-auto max-h-[96dvh] lg:max-h-[92vh] flex flex-col">
        <header className="px-5 py-4 md:px-8 md:py-6 border-b border-gray-100 dark:border-gray-800">
          <h2
            ref={firstFocusRef}
            tabIndex={-1}
            className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 pr-14"
          >
            {data ? data.research_title : 'Loading...'}
          </h2>
          {/* Accessible, tappable close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex items-center justify-center h-10 w-10 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
            aria-label="Close details"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Scrollable content area with consistent vertical rhythm */}
        <div className="px-5 pb-5 md:px-8 md:pb-8 overflow-y-auto">
          {loading && <p className="py-6 text-gray-500 dark:text-gray-400">Fetching details...</p>}
          {error && <p className="py-6 text-red-600">{error}</p>}
          {data && (
            // Rhythm: 16–24px between groups; 8–12px within items
            <div className="space-y-6 md:space-y-8 py-4 md:py-6">
              {/* Meta: Program / Adviser / Publication Date / Status */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Program</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 break-words">
                    {data.program?.code ? `${data.program.code} – ${data.program.name}` : data.program?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Adviser</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 break-words">{data.adviser?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Publication Date</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">{monthName(data.published_month)} {data.published_year}</p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Status</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">Active</p>
                </div>
              </section>

              {/* Abstract */}
              <section>
                <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Abstract</p>
                <p className="mt-2 text-[15px] md:text-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {highlightText(data.research_abstract, searchTerm)}
                </p>
              </section>

              {/* Contributors */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Researchers</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 break-words">
                    {(() => { const names = data.researchers.map(r => r.name).filter(Boolean); return names.length ? names.join(', ') : 'None'; })()}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Panels</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 break-words">
                    {(() => { const names = data.panelists.map(p => p.name).filter(Boolean); return names.length ? names.join(', ') : 'None'; })()}
                  </p>
                </div>
              </section>

              {/* Keywords */}
              <section>
                <p className="text-[11px] md:text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">Keywords</p>
                <p className="mt-1 text-base text-gray-900 dark:text-gray-100 break-words">
                  {(() => { const names = data.keywords.map(k => k.keyword_name).filter(Boolean); return names.length ? names.join(', ') : 'None'; })()}
                </p>
              </section>

              {/* Documents: card-within-card */}
              <section className="bg-gray-50/70 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-xl p-4 md:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300" />
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">Research Documents</h3>
                </div>

                <div className="space-y-3">
                  {/* Approval Sheet Row */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 md:gap-4 min-w-0">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-300 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 truncate">Research Approval Sheet</p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Official approval document</p>
                      </div>
                    </div>
                    {data.research_approval_sheet ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(`/storage/${data.research_approval_sheet}`, `${data.research_title}_approval_sheet.pdf`)}
                        aria-label="Download Research Approval Sheet"
                        title="Download Research Approval Sheet"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md select-none min-h-[40px]">
                        <Download className="w-4 h-4" />
                        Not Available
                      </span>
                    )}
                  </div>

                  {/* Manuscript Row */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 md:gap-4 min-w-0">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-300 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 truncate">Research Manuscript</p>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Full research paper</p>
                      </div>
                    </div>
                    {data.research_manuscript ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(`/storage/${data.research_manuscript}`, `${data.research_title}_manuscript.pdf`)}
                        aria-label="Download Research Manuscript"
                        title="Download Research Manuscript"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md select-none min-h-[40px]">
                        <Download className="w-4 h-4" />
                        Not Available
                      </span>
                    )}
                  </div>
                </div>

                {/* Availability status */}
                <div>
                  {data.research_approval_sheet || data.research_manuscript ? (
                    <div className="flex items-start gap-2 bg-white dark:bg-gray-900 border border-green-200 dark:border-green-800 rounded-md p-2.5 md:p-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-700 dark:text-green-400">Documents Available</p>
                        <p className="text-gray-700 dark:text-gray-300">You can download the available documents above.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-md p-2.5 md:p-3">
                      <XCircle className="w-5 h-5 text-orange-600 mt-0.5" />
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
