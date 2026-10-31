import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WorkflowNoteModal from '@/components/modals/workflow-note-modal';

function renderWorkflowModal(
    action: 'archive' | 'hardDelete',
    props: {
        open?: boolean;
        isLoading?: boolean;
        onConfirm?: (note: string, confirmation?: string) => void;
    } = {},
) {
    return render(
        <WorkflowNoteModal
            open={props.open ?? true}
            onOpenChange={vi.fn()}
            action={action}
            onConfirm={props.onConfirm ?? vi.fn()}
            isLoading={props.isLoading ?? false}
        />,
    );
}

describe('WorkflowNoteModal', () => {
    it('requires a reason and exact DELETE confirmation for hard delete', () => {
        renderWorkflowModal('hardDelete');

        const reasonInput = screen.getByPlaceholderText('Why should this record be permanently deleted?');
        const deleteInput = screen.getByPlaceholderText('DELETE');
        const confirmButton = screen.getByRole('button', { name: 'Delete permanently' });

        expect(confirmButton).toBeDisabled();
        fireEvent.change(reasonInput, { target: { value: 'Invalid data' } });
        expect(confirmButton).toBeDisabled();
        fireEvent.change(deleteInput, { target: { value: 'REMOVE' } });
        expect(confirmButton).toBeDisabled();
        fireEvent.change(deleteInput, { target: { value: 'DELETE' } });
        expect(confirmButton).toBeEnabled();
    });

    it('passes the reason and DELETE confirmation to the callback', () => {
        const onConfirm = vi.fn<(note: string, confirmation?: string) => void>();
        renderWorkflowModal('hardDelete', { onConfirm });

        fireEvent.change(screen.getByPlaceholderText('Why should this record be permanently deleted?'), {
            target: { value: 'Invalid data' },
        });
        fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELETE' } });
        fireEvent.click(screen.getByRole('button', { name: 'Delete permanently' }));

        expect(onConfirm).toHaveBeenCalledWith('Invalid data', 'DELETE');
    });

    it('requires an archive reason without asking for DELETE confirmation', () => {
        renderWorkflowModal('archive');

        expect(screen.getByPlaceholderText('Why is this research being archived?')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('DELETE')).not.toBeInTheDocument();
    });

    it('disables confirmation while processing', () => {
        renderWorkflowModal('hardDelete', { isLoading: true });

        expect(screen.getByRole('button', { name: /Working/ })).toBeDisabled();
    });

    it('does not render a dialog when closed or when no action is selected', () => {
        const { rerender } = renderWorkflowModal('archive', { open: false });
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        rerender(
            <WorkflowNoteModal open onOpenChange={vi.fn()} action={null} onConfirm={vi.fn()} />,
        );
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
