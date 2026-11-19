import FilterSidebar from '@/components/browse/research-filters';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/browse/adviser-select', () => ({
    default: () => <div data-testid="adviser-filter" />,
}));

vi.mock('@/components/shared/status-filter-select', () => ({
    StatusFilterSelect: ({ value, onValueChange }: { value?: string; onValueChange?: (value: string) => void }) => (
        <button type="button" onClick={() => onValueChange?.('draft')}>
            {value}
        </button>
    ),
}));

const filterOptions = {
    years: [{ year: 2024, count: 2 }],
    programs: [{ id: 1, name: 'Computer Science', research_count: 2 }],
    advisers: [{ id: 3, name: 'Faculty Adviser', research_count: 2 }],
};

const currentFilters = { years: [], programs: [], advisers: [] };

describe('Browse FilterSidebar', () => {
    it('keeps the existing Browse filters unchanged unless status filtering is enabled', () => {
        render(
            <FilterSidebar
                filterOptions={filterOptions}
                currentFilters={currentFilters}
                onApplyFilters={vi.fn()}
                onResetFilters={vi.fn()}
                isMobile={false}
            />,
        );

        expect(screen.getByText('Year')).toBeInTheDocument();
        expect(screen.getByText('Program')).toBeInTheDocument();
        expect(screen.getByText('Adviser')).toBeInTheDocument();
        expect(screen.queryByText('all')).not.toBeInTheDocument();
    });

    it('includes the optional status selection when enabled', () => {
        const onApplyFilters = vi.fn();

        render(
            <FilterSidebar
                filterOptions={filterOptions}
                currentFilters={{ ...currentFilters, status: 'all' }}
                onApplyFilters={onApplyFilters}
                onResetFilters={vi.fn()}
                isMobile={false}
                showStatusFilter
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'all' }));
        fireEvent.click(screen.getByRole('button', { name: 'Apply Filters' }));

        expect(onApplyFilters).toHaveBeenCalledWith({ ...currentFilters, status: 'draft' });
    });
});
