import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResearchReadOnlyBanner from '@/components/research/research-read-only-banner'
import type { ResearchCapabilities } from '@/types/models'

vi.mock('@/hooks/use-research-capabilities', () => ({
  useResearchCapabilities: vi.fn(),
}))

const { useResearchCapabilities } = await import('@/hooks/use-research-capabilities')

describe('ResearchReadOnlyBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when research is editable', () => {
    ;(useResearchCapabilities as any).mockReturnValue({
      canEdit: true,
      readOnlyReason: null,
    })

    const { container } = render(
      <ResearchReadOnlyBanner capabilities={{ canEdit: true }} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('does not render when there is no readOnlyReason', () => {
    ;(useResearchCapabilities as any).mockReturnValue({
      canEdit: false,
      readOnlyReason: null,
    })

    const { container } = render(
      <ResearchReadOnlyBanner capabilities={{ canEdit: false }} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders banner when research is read-only with a reason', () => {
    const reason = 'This research is submitted for review and cannot be edited.'
    ;(useResearchCapabilities as any).mockReturnValue({
      canEdit: false,
      readOnlyReason: reason,
    })

    render(
      <ResearchReadOnlyBanner
        capabilities={{ canEdit: false, readOnlyReason: reason }}
      />
    )

    expect(screen.getByText('Read-only workflow')).toBeInTheDocument()
    expect(screen.getByText(reason)).toBeInTheDocument()
  })

  it('renders with proper styling for read-only state', () => {
    const reason = 'This research has been archived.'
    ;(useResearchCapabilities as any).mockReturnValue({
      canEdit: false,
      readOnlyReason: reason,
    })

    render(
      <ResearchReadOnlyBanner
        capabilities={{ canEdit: false, readOnlyReason: reason }}
      />
    )

    const alert = screen.getByRole('alert', { hidden: true })
    expect(alert).toHaveClass('border-amber-200', 'bg-amber-50', 'text-amber-900')
  })
})
