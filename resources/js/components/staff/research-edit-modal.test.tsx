import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ResearchEditModal from '@/components/staff/research-edit-modal'

const { fetchMock, routerPostMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  routerPostMock: vi.fn(),
}))

vi.mock('@inertiajs/react', () => ({
  router: {
    post: routerPostMock,
  },
}))

describe('ResearchEditModal', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    routerPostMock.mockReset()
    Object.defineProperty(global, 'fetch', { writable: true, value: fetchMock })
  })

  it('keeps Submit for Review disabled while the student form is incomplete', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 42,
          research_title: 'Example Research',
          program_id: 1,
          research_adviser: 8,
          completed_month: null,
          completed_year: null,
          research_abstract: '',
          research_approval_sheet: null,
          research_manuscript: null,
          researchers: [
            { id: 1, first_name: 'Ana', middle_name: '', last_name: 'Student', email: 'ana@student.edu' },
          ],
          keyword_names: ['Education'],
          panelist_ids: [2],
          agenda_ids: [1],
          sdg_ids: [1],
          srig_ids: [1],
        },
      }),
    })

    render(
      <ResearchEditModal
        researchId={42}
        programs={[{ id: 1, name: 'Information Systems' }]}
        faculties={[
          { id: 8, first_name: 'Adviser', middle_name: '', last_name: 'Faculty' },
          { id: 2, first_name: 'Panel', middle_name: '', last_name: 'Member' },
        ]}
        keywordOptions={[{ id: 1, keyword_name: 'Education' }]}
        agendas={[{ id: 1, name: 'Education' }]}
        sdgs={[{ id: 1, name: 'SDG 1' }]}
        srigs={[{ id: 1, name: 'SRIG 1' }]}
        onClose={() => {}}
        onSaved={() => {}}
        studentMode
      />
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: /submit for review/i })).toBeDisabled()
  })
})
