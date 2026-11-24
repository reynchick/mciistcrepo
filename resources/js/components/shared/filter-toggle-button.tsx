import { Filter } from 'lucide-react';

type Props = {
    isOpen: boolean;
    activeFilterCount: number;
    onClick: () => void;
    className?: string;
};

export default function FilterToggleButton({ isOpen, activeFilterCount, onClick, className = '' }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-expanded={isOpen}
            className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-blue-500 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 ${className}`}
        >
            <Filter className="h-4 w-4" />
            <span>{isOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {activeFilterCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                    {activeFilterCount}
                </span>
            )}
        </button>
    );
}
