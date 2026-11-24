import CardScreenModal from '@/components/librarian/card-screen-modal';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Librarian CardScreenModal', () => {
    it('marks lead authors inline with the other creators', () => {
        render(
            <CardScreenModal
                open
                onOpenChange={() => {}}
                fallbackTitle="Example research"
                metadata={[]}
                creatorNames={['Lead Author Name', 'Co Author Name']}
                leadCreatorNames={['Lead Author Name']}
            />,
        );

        expect(screen.getByText('Lead Author Name (lead author), Co Author Name')).toBeInTheDocument();
        expect(screen.queryByText(/Lead author:/)).not.toBeInTheDocument();
    });

    it('shows repeated subject metadata together on one line', () => {
        render(
            <CardScreenModal
                open
                onOpenChange={() => {}}
                fallbackTitle="Example research"
                metadata={[
                    { term: 'subject', value: 'Subject one', sort_order: 0 },
                    { term: 'subject', value: 'Subject two', sort_order: 1 },
                    { term: 'publisher', value: 'Example publisher' },
                ]}
            />,
        );

        expect(screen.getByText('Subject one, Subject two')).toBeInTheDocument();
        expect(screen.getByText('Example publisher')).toBeInTheDocument();
    });

    it.each([
        ['draft', 'Edit research entry'],
        ['posted', 'Edit research'],
    ])('labels the edit button for %s research', (status, label) => {
        const onEdit = vi.fn();

        render(
            <CardScreenModal open onOpenChange={() => {}} fallbackTitle="Example research" metadata={[]} systemInfo={{ status }} onEdit={onEdit} />,
        );

        fireEvent.click(screen.getByRole('button', { name: label }));
        expect(onEdit).toHaveBeenCalledOnce();
    });
});
