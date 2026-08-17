import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResearchSaveDecisionModal from '@/components/modals/research-save-decision-modal'
import type { SaveDecisionRequired } from '@/types/models'

const mockVisit = vi.fn()
const mockPost = vi.fn()

vi.mock('@inertiajs/react', () => ({
  router: {
    visit: mockVisit,
    post: mockPost,
  },
  usePage: () => ({ props: { flash: {} } }),
}))

describe('ResearchSaveDecisionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders removal-only confirmation with Cancel and Save Changes buttons', () => {
    const decisionData: SaveDecisionRequired = {
      invitation_decision_required: true,
      removal_only: true,
      summary: {
        added: [],
        changed_emails: [],
        removed: [
          { researcher_id: 1, name: 'John Doe', email: 'john@example.com' },
        ],
        expired: [],
        archive_revoked: [],
      },
    }

    render(
      <ResearchSaveDecisionModal
        isOpen={true}
        decisionData={decisionData}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    expect(screen.getByText('Save Changes')).toBeInTheDocument()
    expect(screen.queryByText('Save Only')).not.toBeInTheDocument()
    expect(screen.queryByText('Save & Send Invitations')).not.toBeInTheDocument()
  })

  it('renders full modal with Cancel, Save Only, and Save & Send Invitations when adding researchers', () => {
    const decisionData: SaveDecisionRequired = {
      invitation_decision_required: true,
      removal_only: false,
      summary: {
        added: [
          { researcher_id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        ],
        changed_emails: [],
        removed: [],
        expired: [],
        archive_revoked: [],
      },
    }

    render(
      <ResearchSaveDecisionModal
        isOpen={true}
        decisionData={decisionData}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    expect(screen.getByText('Save Only')).toBeInTheDocument()
    expect(screen.getByText('Save & Send Invitations')).toBeInTheDocument()
  })

  it('groups and displays all summary categories', () => {
    const decisionData: SaveDecisionRequired = {
      invitation_decision_required: true,
      removal_only: false,
      summary: {
        added: [
          { name: 'New Researcher', email: 'new@example.com' },
        ],
        changed_emails: [
          { name: 'Researcher', old_email: 'old@example.com', new_email: 'new@example.com' },
        ],
        removed: [
          { name: 'Removed Person', email: 'removed@example.com' },
        ],
        expired: [
          { name: 'Expired Invitation', email: 'expired@example.com' },
        ],
        archive_revoked: [
          { name: 'Archive Revoked', email: 'archived@example.com' },
        ],
      },
    }

    render(
      <ResearchSaveDecisionModal
        isOpen={true}
        decisionData={decisionData}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    expect(screen.getByText(/new researchers?/i)).toBeInTheDocument()
    expect(screen.getByText(/changed email/i)).toBeInTheDocument()
    expect(screen.getByText(/removed researchers?/i)).toBeInTheDocument()
    expect(screen.getByText(/expired invitations?/i)).toBeInTheDocument()
    expect(screen.getByText(/access revoked/i)).toBeInTheDocument()
  })

  it('disables buttons when processing', () => {
    const decisionData: SaveDecisionRequired = {
      invitation_decision_required: true,
      removal_only: false,
      summary: {
        added: [{ name: 'Test', email: 'test@example.com' }],
        changed_emails: [],
        removed: [],
        expired: [],
        archive_revoked: [],
      },
    }

    render(
      <ResearchSaveDecisionModal
        isOpen={true}
        decisionData={decisionData}
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
    const decisionData: SaveDecisionRequired = {
      invitation_decision_required: true,
      removal_only: false,
      summary: {
        added: [],
        changed_emails: [],
        removed: [],
        expired: [],
        archive_revoked: [],
      },
    }

    const { container } = render(
      <ResearchSaveDecisionModal
        isOpen={false}
        decisionData={decisionData}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    // Dialog should not be visible
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn()
    const decisionData: SaveDecisionRequired = {
      invitation_decision_required: true,
      removal_only: true,
      summary: {
        added: [],
        changed_emails: [],
        removed: [{ name: 'Test', email: 'test@example.com' }],
        expired: [],
        archive_revoked: [],
      },
    }

    render(
      <ResearchSaveDecisionModal
        isOpen={true}
        decisionData={decisionData}
        onClose={onClose}
        onConfirm={vi.fn()}
        isProcessing={false}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    expect(onClose).toHaveBeenCalled()
  })
})
