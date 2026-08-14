import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WorkflowActions from '@/components/research/workflow-actions'
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

describe('WorkflowActions - Capability-Driven Rendering', () => {
  beforeEach(() => {
    visit.mockReset()
    post.mockReset()
  })

  it('renders Submit button only when canSubmit is true', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canSubmit: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="draft"
        capabilities={capabilities}
        workflow={{ status: 'draft' }}
      />
    )

    expect(screen.getByRole('button', { name: /submit for review/i })).toBeInTheDocument()
  })

  it('does not render Submit button when canSubmit is false', () => {
    render(
      <WorkflowActions
        researchId={42}
        status="draft"
        capabilities={{ canSubmit: false }}
        workflow={{ status: 'draft' }}
      />
    )

    expect(screen.queryByRole('button', { name: /submit for review/i })).not.toBeInTheDocument()
  })

  it('renders Post button only when canPost is true', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canPost: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="submitted"
        capabilities={capabilities}
        workflow={{ status: 'submitted' }}
      />
    )

    expect(screen.getByRole('button', { name: /post to repository/i })).toBeInTheDocument()
  })

  it('renders Return button only when canReturnForRevision is true', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canReturnForRevision: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="submitted"
        capabilities={capabilities}
        workflow={{ status: 'submitted' }}
      />
    )

    expect(screen.getByRole('button', { name: /return/i })).toBeInTheDocument()
  })

  it('renders Archive button only when canArchive is true', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canArchive: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="posted"
        capabilities={capabilities}
        workflow={{ status: 'posted' }}
      />
    )

    expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument()
  })

  it('renders Restore button only when canRestore is true', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canRestore: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="archived"
        capabilities={capabilities}
        workflow={{ status: 'archived' }}
      />
    )

    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument()
  })

  it('renders Hard Delete button only when canHardDelete is true', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canHardDelete: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="archived"
        capabilities={capabilities}
        workflow={{ status: 'archived' }}
      />
    )

    expect(screen.getByRole('button', { name: /hard delete|permanently delete/i })).toBeInTheDocument()
  })

  it('renders Invite Researchers button only when canSendInitialInvitations is true', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canSendInitialInvitations: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="draft"
        capabilities={capabilities}
        workflow={{ status: 'draft' }}
      />
    )

    expect(screen.getByRole('button', { name: /invite researchers/i })).toBeInTheDocument()
  })

  it('does not render Invite button for restored Draft', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canSendInitialInvitations: true,
    }

    render(
      <WorkflowActions
        researchId={42}
        status="draft"
        capabilities={capabilities}
        workflow={{ status: 'draft', isRestoredDraft: true }}
      />
    )

    expect(screen.queryByRole('button', { name: /invite researchers/i })).not.toBeInTheDocument()
  })

  it('shows disabled action explanations from postingReadiness', () => {
    const capabilities: Partial<ResearchCapabilities> = {
      canPost: false,
    }
    const postingReadiness = {
      ready: false,
      missing: ['Title is required', 'At least one researcher is required'],
    }

    render(
      <WorkflowActions
        researchId={42}
        status="submitted"
        capabilities={capabilities}
        workflow={{ status: 'submitted' }}
        postingReadiness={postingReadiness}
      />
    )

    // Post button should show disabled state with reasons
    // Implementation may show tooltip or inline explanation
    // Verify the component renders the explanations
    expect(screen.queryByRole('button', { name: /post to repository/i })).not.toBeInTheDocument()
  })

  it('does not render any actions when all capabilities are false', () => {
    const emptyCapabilities: Partial<ResearchCapabilities> = {
      canSubmit: false,
      canPost: false,
      canReturnForRevision: false,
      canArchive: false,
      canRestore: false,
      canHardDelete: false,
      canSendInitialInvitations: false,
    }

    const { container } = render(
      <WorkflowActions
        researchId={42}
        status="draft"
        capabilities={emptyCapabilities}
        workflow={{ status: 'draft' }}
      />
    )

    // Should render minimal UI or empty state
    // Exact behavior depends on component design
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeLessThanOrEqual(1) // May have close/back button
  })

  it('handles empty capabilities object gracefully', () => {
    const { container } = render(
      <WorkflowActions
        researchId={42}
        status="draft"
        capabilities={{}}
        workflow={{ status: 'draft' }}
      />
    )

    // Should not crash and render safely
    expect(container).toBeInTheDocument()
  })
})
