interface Program { id: number; name: string; code?: string }
interface Adviser { id: number; name?: string; first_name?: string; last_name?: string }
interface ResearchItem {
    id: number;
    title?: string;
    research_title?: string;
    completed_year?: number;
    year?: number;
    program?: Program;
    adviser?: Adviser;
    abstract?: string;
    research_abstract?: string;
}

interface ResearchListProps {
    researches: ResearchItem[];
    compact?: boolean;
    onOpen?: (id: number) => void;
}

// Same background as ResearchCard
const CARD_BG = '#f6fff8';
const DOT_COLOR = 'rgba(2,132,199,0.28)';

export function ResearchList({ researches, compact = false, onOpen }: ResearchListProps) {
    if (researches.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No researches found
            </div>
        );
    }

    return (
        // Mobile optimization: tighter vertical spacing for more items per screen
        <div className="space-y-3 pb-3 md:space-y-5">
            {researches.map((research) => (
                <div
                    key={research.id}
                    onClick={() => onOpen?.(research.id)}
                    style={{ backgroundColor: CARD_BG }}
                    // Mobile optimization: compact padding and smaller border spacing
                    className="group relative overflow-hidden border-b border-neutral-200 last:border-b-0 dark:border-neutral-800 px-4 py-3.5 md:px-6 md:py-5 rounded shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer"
                >
                    {/* Dotted pattern, top right (decorative, same as ResearchCard) */}
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

                    <div className="relative space-y-1.5 md:space-y-2.5">
                        {/* Title */}
                        {/* Mobile optimization: smaller title on mobile */}
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 cursor-pointer line-clamp-2">
                            {research.title ?? research.research_title ?? ''}
                        </h3>

                        {/* Metadata */}
                        {/* Mobile optimization: smaller text and tighter gaps */}
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {research.adviser && (
                                <span>
                                    {research.adviser.name ?? [research.adviser.last_name, research.adviser.first_name].filter(Boolean).join(', ')}
                                </span>
                            )}
                            {research.adviser && research.program && <span>•</span>}
                            {research.program && (
                                <span className="font-medium text-blue-600">
                                    {research.program.name}
                                </span>
                            )}
                            {(research.adviser || research.program) && (research.year ?? research.completed_year) && <span>•</span>}
                            {(research.year ?? research.completed_year) && <span>{research.year ?? research.completed_year}</span>}
                        </div>

                        {/* Abstract (if not compact) */}
                        {/* Mobile optimization: hide abstract completely on mobile */}
                        {!compact && (research.abstract ?? research.research_abstract) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-3 leading-relaxed">
                                {research.abstract ?? research.research_abstract}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}