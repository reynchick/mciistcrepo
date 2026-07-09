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
  year: number; // published_year
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
 * Program badge color mapping
 */
const programColors: Record<string, { bg: string; text: string; border: string }> = {
  BSIT: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  BSCS: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  BLIS: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  MIT: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  DIT: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
};

/**
 * Get program color classes based on program code
 */
const getProgramColors = (programCode: string) => {
  return programColors[programCode] || {
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    text: 'text-gray-800 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  };
};

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
export default function ResearchCard({ research, searchTerm, onViewDetails }: ResearchCardProps) {
  const programColors = getProgramColors(research.program.code || '');

  return (
    <div className="block group">
      <article
        className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 shadow-sm 
                   hover:shadow-lg hover:-translate-y-1 
                   transition-all duration-300 ease-in-out
                   p-3 md:p-5 h-full flex flex-col
                   cursor-pointer"
        onClick={() => onViewDetails?.(research.id)}
      >
        {/* Mobile optimization: tighter header spacing and padding */}
        {/* Header: Program and Year badges */}
        <div className="flex items-start justify-between gap-2 md:gap-3 mb-2 md:mb-3 lg:mb-4">
          {/* Program badge */}
          <span
            className={`
              inline-flex items-center px-3 py-1 md:px-3.5 md:py-1.5 rounded-full text-xs font-semibold
              border ${programColors.bg} ${programColors.text} ${programColors.border}
            `}
          >
            {research.program.code}
          </span>

          {/* Year badge */}
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="text-xs md:text-sm font-medium">{research.year}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 md:mb-3 lg:mb-4 
                     line-clamp-1 md:line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400
                     transition-colors duration-200"
          title={research.title}
        >
          {highlightText(research.title, searchTerm)}
        </h3>

        {/* Researchers */}
        <div className="mb-2 md:mb-3 lg:mb-4">
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            <span className="font-medium">By:</span> {formatResearchers(research.researchers)}
          </p>
        </div>

        {/* Adviser */}
        <div className="mb-2 md:mb-3 lg:mb-4">
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            <span className="font-medium">Adviser:</span> {buildPersonName(research.adviser) || 'N/A'}
          </p>
        </div>

        {/* Abstract preview */}
        {/* Mobile optimization: reduce abstract lines for compact height */}
        <div className="mb-2 md:mb-3 lg:mb-4 flex-1">
          <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {highlightText(truncateText(research.abstract), searchTerm)}
          </p>
        </div>  

        {/* Keywords */}
        {/* Mobile optimization: hide keywords entirely on mobile */}
        {research.keywords && (
          <div className="hidden md:block mb-3 lg:mb-4 md:pb-3 lg:pb-4 border-b border-gray-100 dark:border-neutral-800">
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Keywords:</span>{' '}
              {(() => {
                const list = (research.keywords || '').split(',').map((k) => k.trim()).filter(Boolean)
                const visible = list.slice(0, 5)
                const hidden = list.slice(5)
                return (
                  <>
                    <span>{visible.join(', ')}</span>
                    {hidden.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 font-medium" aria-label="Show more keywords">
                          +{hidden.length} more
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="p-2 text-xs max-w-xs bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
                          <div className="text-gray-800 dark:text-gray-200">{hidden.join(', ')}</div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* View Details button */}
        <div className="mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(research.id); }}
            type="button"
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 focus:outline-none"
          >
            View Details
            <svg
              className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </article>
    </div>
  );
}
