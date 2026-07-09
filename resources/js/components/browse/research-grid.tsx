import React, { useState } from 'react';
import ResearchCard from './research-card';
import ResearchDetailsModal from './research-details-modal';

/**
 * Research data structure
 */
interface Research {
  id: number;
  title: string;
  abstract: string;
  keywords: string;
  year: number;
  program: {
    id: number;
    code: string;
    name: string;
  };
  researchers: Array<{
    id: number;
    name: string;
  }>;
  adviser: {
    id: number;
    name: string;
  };
  research_approval_sheet?: string | null;
  research_manuscript?: string | null;
}

interface ResearchGridProps {
  researches: Research[];
  isLoading: boolean;
  searchTerm: string;
}

/**
 * Loading skeleton for research cards
 */
const SkeletonCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 animate-pulse">
    {/* Header badges */}
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      <div className="h-5 w-12 bg-gray-200 rounded"></div>
    </div>

    {/* Title */}
    <div className="space-y-2 mb-3">
      <div className="h-5 bg-gray-200 rounded w-full"></div>
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
    </div>

    {/* Researchers */}
    <div className="flex items-start gap-2 mb-2">
      <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>

    {/* Adviser */}
    <div className="flex items-start gap-2 mb-4">
      <div className="w-4 h-4 bg-gray-200 rounded mt-0.5"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>

    {/* Abstract */}
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>

    {/* Keywords */}
    <div className="mb-4 pb-4 border-b border-gray-100">
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>

    {/* View Details button */}
    <div className="h-5 bg-gray-200 rounded w-24"></div>
  </div>
);

/**
 * Empty state component
 */
const EmptyState = ({ searchTerm }: { searchTerm: string }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
    <div className="w-24 h-24 mb-6 text-gray-300">
      <svg
        className="w-full h-full"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      No Research Found
    </h3>
    <p className="text-gray-600 text-center max-w-md">
      {searchTerm ? (
        <>
          No research papers match your search for{' '}
          <span className="font-semibold text-gray-900">"{searchTerm}"</span>.
          Try adjusting your filters or search terms.
        </>
      ) : (
        <>
          No research papers match your current filters.
          Try adjusting your filter criteria to see more results.
        </>
      )}
    </p>
  </div>
);

/**
 * ResearchGrid component - Displays research cards in a responsive grid layout
 */
export default function ResearchGrid({
  researches,
  isLoading,
  searchTerm,
}: ResearchGridProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  const handleClose = () => setOpenId(null);
  /**
   * Render loading skeletons
   */
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton for result count */}
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </div>

        {/* Loading skeleton grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (researches.length === 0) {
    return (
      <div className="space-y-4">
        {/* Result count (0 results) */}
        <p className="text-sm text-gray-600 animate-fade-in">
          Found <span className="font-semibold text-gray-900">0</span> researches
        </p>

        {/* Empty state */}
        <div className="grid grid-cols-1">
          <EmptyState searchTerm={searchTerm} />
        </div>
      </div>
    );
  }

  /**
   * Render research grid
   */
  return (
    <div className="space-y-4">

      {/* Research grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {researches.map((research) => (
          <ResearchCard
            key={research.id}
            research={research}
            searchTerm={searchTerm}
            onViewDetails={setOpenId}
          />
        ))}
      </div>
      <ResearchDetailsModal id={openId} onClose={handleClose} searchTerm={searchTerm} />
    </div>
  );
}