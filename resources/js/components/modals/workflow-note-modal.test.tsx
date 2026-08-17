import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowNoteModal from '@/components/modals/workflow-note-modal'

const mockPost = vi.fn()

vi.mock('@inertiajs/react', () => ({
  router: { post: mockPost },
  usePage: () => ({ props: { flash: {} } }),
}))

describe('WorkflowNoteModal - Hard Delete Variant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires exact DELETE text to enable confirmation for hard delete', () => {
    render(
      <WorkflowNoteModal
        isOpen={true}
        title="Permanently Delete Research"
        subtitle="This action cannot be undone"
        mode="hard_delete"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    const deleteInput = screen.getByPlaceholderText(/type DELETE/i) as HTMLInputElement
    const confirmButton = screen.getByRole('button', { name: /permanently delete/i })

    // Button should be disabled initially
    expect(confirmButton).toBeDisabled()

    // Typing incorrect text should not enable
    fireEvent.change(deleteInput, { target: { value: 'REMOVE' } })
    expect(confirmButton).toBeDisabled()

    // Typing exact DELETE should enable
    fireEvent.change(deleteInput, { target: { value: 'DELETE' } })
    expect(confirmButton).not.toBeDisabled()

    // Removing text should disable again
    fireEvent.change(deleteInput, { target: { value: 'DELET' } })
    expect(confirmButton).toBeDisabled()
  })

  it('requires a deletion reason for hard delete', () => {
    render(
      <WorkflowNoteModal
        isOpen={true}
        title="Permanently Delete Research"
        subtitle="This action cannot be undone"
        mode="hard_delete"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    const reasonInput = screen.getByPlaceholderText(/reason for deletion/i) as HTMLInputElement
    const deleteInput = screen.getByPlaceholderText(/type DELETE/i) as HTMLInputElement
    const confirmButton = screen.getByRole('button', { name: /permanently delete/i })

    // Type DELETE but no reason
    fireEvent.change(deleteInput, { target: { value: 'DELETE' } })
    expect(confirmButton).toBeDisabled()

    // Add reason
    fireEvent.change(reasonInput, { target: { value: 'Test reason' } })
    expect(confirmButton).not.toBeDisabled()

    // Remove reason
    fireEvent.change(reasonInput, { target: { value: '' } })
    expect(confirmButton).toBeDisabled()
  })

  it('displays permanent deletion warning', () => {
    render(
      <WorkflowNoteModal
        isOpen={true}
        title="Permanently Delete Research"
        mode="hard_delete"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    expect(screen.getByText(/permanent|cannot be undone|cannot be recovered/i)).toBeInTheDocument()
  })

  it('calls onConfirm with reason and DELETE confirmation when confirmed', () => {
    const onConfirm = vi.fn()

    render(
      <WorkflowNoteModal
        isOpen={true}
        title="Permanently Delete Research"
        mode="hard_delete"
        onClose={vi.fn()}
        onConfirm={onConfirm}
        isProcessing={false}
      />
    )

    const reasonInput = screen.getByPlaceholderText(/reason for deletion/i) as HTMLInputElement
    const deleteInput = screen.getByPlaceholderText(/type DELETE/i) as HTMLInputElement
    const confirmButton = screen.getByRole('button', { name: /permanently delete/i })

    fireEvent.change(reasonInput, { target: { value: 'Invalid data' } })
    fireEvent.change(deleteInput, { target: { value: 'DELETE' } })
    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledWith('Invalid data')
  })

  it('disables buttons when processing', () => {
    render(
      <WorkflowNoteModal
        isOpen={true}
        title="Permanently Delete Research"
        mode="hard_delete"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled()
    })
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <WorkflowNoteModal
        isOpen={false}
        title="Permanently Delete Research"
        mode="hard_delete"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })
})

describe('WorkflowNoteModal - Archive Variant', () => {
  it('requires archive reason but not DELETE confirmation', () => {
    render(
      <WorkflowNoteModal
        isOpen={true}
        title="Archive Research"
        mode="archive"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    expect(screen.queryByPlaceholderText(/type DELETE/i)).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText(/reason for archiving/i)).toBeInTheDocument()
  })
})
