interface Program { id: number; name: string; code?: string }
interface Adviser { id: number; name?: string; first_name?: string; last_name?: string }
interface ResearchItem {
    id: number;
    title?: string;
    research_title?: string;
    published_year?: number;
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
        <div className="space-y-2 md:space-y-4">
            {researches.map((research) => (
                <div
                    key={research.id}
                    onClick={() => onOpen?.(research.id)}
                    // Mobile optimization: compact padding and smaller border spacing
                    className="group border-b border-neutral-200 pb-2 md:pb-4 last:border-b-0 dark:border-neutral-800 hover:bg-white:hover:bg-neutral-900/50 px-1.5 py-1.5 md:px-2 md:py-2 rounded shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer"
                >
                    <div className="space-y-1">
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
                            {(research.adviser || research.program) && (research.year ?? research.published_year) && <span>•</span>}
                            {(research.year ?? research.published_year) && <span>{research.year ?? research.published_year}</span>}
                        </div>

                        {/* Abstract (if not compact) */}
                        {/* Mobile optimization: hide abstract completely on mobile */}
                        {!compact && (research.abstract ?? research.research_abstract) && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                                {research.abstract ?? research.research_abstract}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
