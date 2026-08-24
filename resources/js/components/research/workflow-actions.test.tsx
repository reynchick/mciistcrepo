import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowActions from '@/components/research/workflow-actions'
import WorkflowNoteModal from '@/components/modals/workflow-note-modal'
import type { ResearchCapabilities } from '@/types/models'

const { visit, post } = vi.hoisted(() => ({
  visit: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@inertiajs/react', () => ({
  router: {
    visit,
    post,
  },
  usePage: () => ({ props: { flash: {} } }),
}))

describe('WorkflowActions', () => {
  beforeEach(() => {
    visit.mockReset()
    post.mockReset()
  })

  it('renders workflow actions based on backend capabilities', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canSubmit: true,
      canEdit: true,
      canSendInitialInvitations: true,
      canReturnForRevision: true,
      canPost: true,
      canArchive: true,
      canRestore: true,
      canHardDelete: true,
    }

    render(<WorkflowActions researchId={42} status="draft" capabilities={capabilities} workflow={{ status: 'draft' }} />)

    expect(screen.getByRole('button', { name: /submit for review/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /return/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /post to repository/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hard delete/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /invite researchers/i })).toBeInTheDocument()
  })

  it('hides workflow actions when the backend does not allow them', () => {
    render(<WorkflowActions researchId={42} status="draft" capabilities={{}} workflow={{ status: 'draft' }} />)

    expect(screen.queryByRole('button', { name: /submit for review/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /return/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /post to repository/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /archive/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /hard delete/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /invite researchers/i })).not.toBeInTheDocument()
  })
})

describe('WorkflowNoteModal hard-delete validation', () => {
  it('requires a reason and the exact DELETE confirmation before submitting', () => {
    const onConfirm = vi.fn()

    render(<WorkflowNoteModal open action="hardDelete" onOpenChange={() => {}} onConfirm={onConfirm} />)

    const confirmButton = screen.getByRole('button', { name: /delete permanently/i })
    expect(confirmButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: 'Remove the duplicate entry permanently.' },
    })
    expect(confirmButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/type delete to confirm/i), {
      target: { value: 'DELETE' },
    })

    expect(confirmButton).toBeEnabled()

    fireEvent.click(confirmButton)

    expect(onConfirm).toHaveBeenCalledWith('Remove the duplicate entry permanently.', 'DELETE')
  })
})
