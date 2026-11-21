import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/**
 * Research data structure
 */
interface ResearchListItem {
  id: number;
  title: string; // maps to research_title
  abstract: string; // maps to research_abstract
  keywords: string; // prejoined string
  year: number; // completed_year
  program: {
    id: number;
    code?: string | null;
    name: string;
  };
  // researchers may arrive as {id,name} OR {id,first_name,middle_name,last_name}
  researchers: Array<{ id: number; name?: string; first_name?: string; middle_name?: string | null; last_name?: string }>;
  adviser: { id: number; name?: string; first_name?: string; middle_name?: string | null; last_name?: string };
}


interface ResearchCardProps {
  research: ResearchListItem;
  searchTerm?: string;
  onViewDetails?: (id: number) => void;
}

/**
 * Single card theme: every card uses the same #e2eafc surface.
 * Only the card carries a soft shadow that shows below the card only and a faint border; nothing inside it has a border.
 */
const CARD_BG = '#f6fff8';
const DOT_COLOR = 'rgba(2,132,199,0.28)';

/* Click ripple on the View Details button */
const RIPPLE_KEYFRAMES = `
@keyframes rc-ripple {
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}
@keyframes rc-arrow-pop {
  0%   { transform: translateX(0) scale(1); }
  40%  { transform: translateX(4px) scale(0.9); }
  100% { transform: translateX(0) scale(1); }
}
.rc-ripple { animation: rc-ripple 0.6s ease-out forwards; }
.rc-arrow-pop { animation: rc-arrow-pop 0.4s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .rc-ripple, .rc-arrow-pop { animation: none; }
}
`;

/**
 * Highlight search term in text
 */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const highlightText = (text: string, searchTerm?: string): React.ReactNode => {
  if (!searchTerm || !text) return text;
  const safe = escapeRegExp(searchTerm);
  try {
    const regex = new RegExp(`(${safe})`, 'gi');
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-gray-900 dark:text-gray-100 font-medium px-0.5 rounded">{part}</mark>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
};

const truncateText = (text: string, maxChars = 280): string => {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  const cut = normalized.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  const safeCut = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${safeCut}…`;
};

/**
 * Format researchers list with truncation
 */
const buildPersonName = (p: { name?: string; first_name?: string; middle_name?: string | null; last_name?: string }): string => {
  if (p.name) return p.name;
  if (!p.first_name && !p.last_name) return '';
  return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

const formatResearchers = (researchers: ResearchListItem['researchers']): string => {
  if (!researchers || researchers.length === 0) return 'No researchers listed';
  const names = researchers.map(r => buildPersonName(r) || '');
  if (names.filter(Boolean).length === 0) return 'No researchers listed';
  if (researchers.length <= 3) {
    return names.join(', ');
  }
  const first3 = names.slice(0, 3).join(', ');
  const remaining = researchers.length - 3;
  return `${first3}, and ${remaining} more`;
};

/**
 * ResearchCard component - Displays a single research paper in card format
 */
/**
 * Keywords field: always exactly two rows tall (46px = 2 x 20px pills + 6px gap).
 * Shows as many pills as fit in two rows; the rest go behind a "+N" dropdown.
 */
const PILL_H = 20;
const PILL_GAP = 6;
const KEYWORD_ROWS_H = PILL_H * 2 + PILL_GAP;
const PLUS_PILL_W = 36;

const KEYWORD_PILL_CLS =
  'inline-flex h-5 max-w-full shrink-0 items-center truncate rounded-full bg-white/70 px-2.5 text-[11px] font-medium leading-5 text-sky-800';

function KeywordRows({ keywords }: { keywords: string[] }) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(keywords.length);

  React.useEffect(() => {
    const box = boxRef.current;
    const measure = measureRef.current;
    if (!box || !measure) return;

    const recalc = () => {
      const pills = Array.from(measure.children) as HTMLElement[];
      if (pills.length === 0) return;
      const width = box.clientWidth;
      measure.style.width = `${width}px`;

      const firstTop = pills[0].offsetTop;
      const secondRowBottom = firstTop + KEYWORD_ROWS_H;
      let count = pills.findIndex((el) => el.offsetTop + PILL_H > secondRowBottom + 1);

      if (count === -1) {
        setVisibleCount(pills.length); // everything fits in two rows
        return;
      }

      // Leave room for the "+N" pill on the second row
      while (count > 0) {
        const last = pills[count - 1];
        const onSecondRow = last.offsetTop > firstTop;
        const right = last.offsetLeft + last.offsetWidth;
        if (onSecondRow && right + PILL_GAP + PLUS_PILL_W > width) count -= 1;
        else if (!onSecondRow) break;
        else break;
      }
      setVisibleCount(Math.max(count, 0));
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(box);
    return () => ro.disconnect();
  }, [keywords]);

  const visible = keywords.slice(0, visibleCount);
  const hidden = keywords.slice(visibleCount);

  return (
    <div className="relative hidden md:block" style={{ height: KEYWORD_ROWS_H }}>
      {/* Invisible measuring copy (all pills) */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex flex-wrap"
        style={{ gap: PILL_GAP }}
      >
        {keywords.map((k) => (
          <span key={k} className={KEYWORD_PILL_CLS}>{k}</span>
        ))}
      </div>

      <div
        ref={boxRef}
        className="flex h-full flex-wrap content-start overflow-hidden"
        style={{ gap: PILL_GAP }}
      >
        {visible.map((k) => (
          <span key={k} className={KEYWORD_PILL_CLS}>{k}</span>
        ))}
        {hidden.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              aria-label="Show more keywords"
              className={`${KEYWORD_PILL_CLS} focus:outline-none`}
            >
              +{hidden.length}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-w-xs p-2">
              <div className="flex flex-wrap gap-1.5">
                {hidden.map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-medium text-sky-900"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default function ResearchCard({ research, searchTerm, onViewDetails }: ResearchCardProps) {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [popKey, setPopKey] = React.useState(0);

  const keywords = (research.keywords || '').split(',').map((k) => k.trim()).filter(Boolean);

  const handleViewDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [
      ...prev,
      {
        id,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        size: Math.max(rect.width, rect.height) * 2.2,
      },
    ]);
    window.setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);

    setPopKey((k) => k + 1);
    onViewDetails?.(research.id);
  };

  return (
    <article
      // Floating hover: card lifts up and the shadow deepens (below the card only)
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-sky-900/10 p-4 shadow-[0_8px_10px_-6px_rgba(0,0,0,0.25),0_14px_18px_-10px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:shadow-[0_16px_18px_-8px_rgba(0,0,0,0.3),0_26px_30px_-12px_rgba(0,0,0,0.28)] md:p-5"
      style={{ backgroundColor: CARD_BG }}
      onClick={() => onViewDetails?.(research.id)}
    >
      <style>{RIPPLE_KEYFRAMES}</style>

      {/* Dotted pattern, top right (decorative) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-28 w-36"
        style={{
          backgroundImage: `radial-gradient(circle, ${DOT_COLOR} 1.2px, transparent 1.4px)`,
          backgroundSize: '10px 10px',
          maskImage: 'linear-gradient(to bottom left, black, transparent 75%)',
          WebkitMaskImage: 'linear-gradient(to bottom left, black, transparent 75%)',
        }}
      />

      {/* Header: program (left) and year pill (upper right) */}
      <div className="relative flex items-center justify-between gap-2">
        <p className="truncate text-xs font-semibold tracking-wide text-sky-800">
          {research.program.code}
        </p>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold leading-none text-sky-900">
          {research.year}
        </span>
      </div>

      {/* Title: always 2 rows */}
      <h3
        className="relative mt-3 line-clamp-2 h-[2.75em] overflow-hidden text-base font-bold leading-snug text-gray-900 md:text-lg"
        title={research.title}
      >
        {highlightText(research.title, searchTerm)}
      </h3>

      {/* Abstract: always 3 rows */}
      <p className="relative mt-2 line-clamp-3 h-[4.875em] overflow-hidden text-xs leading-relaxed text-gray-700 md:text-sm">
        {highlightText(truncateText(research.abstract), searchTerm)}
      </p>

      {/* By: always 1 row */}
      <p
        className="relative mt-3 h-5 truncate text-xs leading-5 text-gray-600"
        title={formatResearchers(research.researchers)}
      >
        <span className="font-medium text-gray-800">By:</span> {formatResearchers(research.researchers)}
      </p>

      {/* Adviser: always 1 row */}
      <p
        className="relative h-5 truncate text-xs leading-5 text-gray-600"
        title={buildPersonName(research.adviser) || 'N/A'}
      >
        <span className="font-medium text-gray-800">Adviser:</span> {buildPersonName(research.adviser) || 'N/A'}
      </p>

      {/* Keywords: always 2 rows */}
      <div className="relative mt-3">
        <KeywordRows keywords={keywords} />
      </div>

      {/* View Details: white pill with a click ripple */}
      <button
        onClick={handleViewDetails}
        type="button"
        className="relative mt-4 flex w-full items-center justify-between overflow-hidden rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm font-medium text-gray-900 transition-transform duration-150 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <span className="relative z-10">View Details</span>

        <span
          key={popKey}
          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-900 ${
            popKey > 0 ? 'rc-arrow-pop' : ''
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>

        {ripples.map((r) => (
          <span
            key={r.id}
            aria-hidden="true"
            className="rc-ripple pointer-events-none absolute rounded-full bg-sky-300"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
          />
        ))}
      </button>
    </article>
  );
}