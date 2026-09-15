import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatusBadge from '@/components/research/status-badge'
import type { ResearchStatus } from '@/types/models'

const mockUsePage = vi.hoisted(() => ({
  usePage: vi.fn(),
}))

vi.mock('@inertiajs/react', () => ({
  usePage: mockUsePage.usePage,
}))

describe('StatusBadge', () => {
  beforeEach(() => {
    mockUsePage.usePage.mockReturnValue({
      props: {
        researchStatuses: {
          draft: { label: 'Draft', badge: 'slate' },
          submitted: { label: 'Submitted for Review', badge: 'amber' },
          returned: { label: 'Returned for Revision', badge: 'rose' },
          posted: { label: 'Posted', badge: 'green' },
          archived: { label: 'Archived', badge: 'slate' },
        },
      },
    })
  })

  it('renders draft status with slate color', () => {
    render(<StatusBadge status="draft" />)
    const badge = screen.getByText('Draft')
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-700')
  })

  it('renders posted status with green color', () => {
    render(<StatusBadge status="posted" />)
    const badge = screen.getByText('Posted')
    expect(badge).toHaveClass('bg-emerald-100', 'text-emerald-800')
  })

  it('renders submitted status with amber color', () => {
    render(<StatusBadge status="submitted" />)
    const badge = screen.getByText('Submitted for Review')
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800')
  })

  it('renders returned status with rose color', () => {
    render(<StatusBadge status="returned" />)
    const badge = screen.getByText('Returned for Revision')
    expect(badge).toHaveClass('bg-rose-100', 'text-rose-800')
  })

  it('renders archived status with slate color', () => {
    render(<StatusBadge status="archived" />)
    const badge = screen.getByText('Archived')
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-700')
  })

  it('applies custom className', () => {
    render(<StatusBadge status="draft" className="custom-class" />)
    const badge = screen.getByText('Draft')
    expect(badge).toHaveClass('custom-class')
  })

  it('handles null status gracefully', () => {
    render(<StatusBadge status={null} />)
    // Should render a badge with fallback styling
    expect(screen.getByRole('generic')).toBeInTheDocument()
  })
})
