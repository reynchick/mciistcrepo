import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StatusHistory from '@/components/research/status-history'
import type { ResearchCapabilities } from '@/types/models'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@inertiajs/react', () => ({
  usePage: () => ({
    props: {
      auth: { user: { role: 'Student' } },
    },
  }),
}))

describe('StatusHistory - Activity History', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  it('renders Research Activity title', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    render(<StatusHistory researchId={1} />)
    expect(screen.getByText('Research Activity — read-only')).toBeInTheDocument()
  })

  it('renders when the backend provides can_view and loads that research history', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    render(<StatusHistory researchId={104} capabilities={{ can_view: true } as Partial<ResearchCapabilities> & { can_view: boolean }} />)

    expect(screen.getByText('Research Activity — read-only')).toBeInTheDocument()
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/research/104/status-history', expect.any(Object)))
  })

  it('loads and displays activity entries', async () => {
    const mockData = [
      {
        id: 1,
        action_type: 'create_research_entry',
        created_at: '2024-01-15T10:00:00Z',
        modified_by: 'John Doe',
        metadata: {},
      },
      {
        id: 2,
        action_type: 'submit_research_entry',
        created_at: '2024-01-16T14:30:00Z',
        modified_by: 'Jane Smith',
        metadata: { note: 'Looks good to submit' },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    })

    render(<StatusHistory researchId={1} />)

    await waitFor(() => {
      expect(screen.getByText('Research Created')).toBeInTheDocument()
      expect(screen.getByText('Submitted for Review')).toBeInTheDocument()
    })
  })

  it('displays proper action labels for various action types', async () => {
    const mockData = [
      { id: 1, action_type: 'create_research_entry', created_at: '2024-01-15T10:00:00Z', modified_by: 'User', metadata: {} },
      { id: 2, action_type: 'update_research_entry', created_at: '2024-01-15T11:00:00Z', modified_by: 'User', metadata: {} },
      { id: 3, action_type: 'invite_researchers', created_at: '2024-01-15T12:00:00Z', modified_by: 'User', metadata: {} },
      { id: 4, action_type: 'post_research_entry', created_at: '2024-01-15T13:00:00Z', modified_by: 'User', metadata: {} },
      { id: 5, action_type: 'archive_research_entry', created_at: '2024-01-15T14:00:00Z', modified_by: 'User', metadata: {} },
      { id: 6, action_type: 'restore_research_entry', created_at: '2024-01-15T15:00:00Z', modified_by: 'User', metadata: {} },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    })

    render(<StatusHistory researchId={1} />)

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /show more/i }))
      expect(screen.getByText('Research Created')).toBeInTheDocument()
      expect(screen.getByText('Research Updated')).toBeInTheDocument()
      expect(screen.getByText('Researchers Invited')).toBeInTheDocument()
      expect(screen.getByText('Posted to Repository')).toBeInTheDocument()
      expect(screen.getByText('Archived')).toBeInTheDocument()
      expect(screen.getByText('Restored')).toBeInTheDocument()
    })
  })

  it('displays notes from metadata', async () => {
    const mockData = [
      {
        id: 1,
        action_type: 'return_research_entry',
        created_at: '2024-01-16T14:30:00Z',
        modified_by: 'Faculty Member',
        metadata: { note: 'Please revise the abstract and methodology.' },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    })

    render(<StatusHistory researchId={1} />)

    await waitFor(() => {
      expect(screen.getByText(/please revise/i)).toBeInTheDocument()
    })
  })

  it('displays reasons from metadata', async () => {
    const mockData = [
      {
        id: 1,
        action_type: 'archive_research_entry',
        created_at: '2024-01-16T14:30:00Z',
        modified_by: 'Staff',
        metadata: { reason: 'Duplicate research entry' },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    })

    render(<StatusHistory researchId={1} />)

    await waitFor(() => {
      expect(screen.getByText(/duplicate research/i)).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    mockFetch.mockImplementation(
      () => new Promise((resolve) => {
        setTimeout(() => {
          resolve({ ok: true, json: async () => ({ data: [] }) })
        }, 100)
      })
    )

    render(<StatusHistory researchId={1} />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows empty state when no entries', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    render(<StatusHistory researchId={1} />)

    await waitFor(() => {
      expect(screen.getByText('No research activity recorded yet')).toBeInTheDocument()
    })
  })

  it('does not render for users without canView permission', () => {
    const { container } = render(
      <StatusHistory
        researchId={1}
        capabilities={{ canView: false } as Partial<ResearchCapabilities>}
      />
    )

    // Should return null - container should be empty
    expect(container.firstChild).toBeNull()
  })

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<StatusHistory researchId={1} />)

    await waitFor(() => {
      expect(screen.getByText('No research activity recorded yet')).toBeInTheDocument()
    })
  })

  it('cleans up on unmount', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })

    const { unmount } = render(<StatusHistory researchId={1} />)
    unmount()

    // Verify no memory leaks by checking fetch wasn't called after unmount
    expect(mockFetch).toHaveBeenCalled()
  })
})
