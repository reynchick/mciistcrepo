import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BasicInfo from '@/components/research/research-form/basic-info'
import { buildResearchDraftStorageKey, cloneFormData, deserializeResearchDraftState, serializeResearchDraftState } from '@/hooks/use-research-save'

describe('BasicInfo read-only behavior', () => {
  it('disables editing fields when canEdit is false', () => {
    render(
      <BasicInfo
        data={{}}
        setData={() => {}}
        errors={{}}
        faculties={[]}
        onValidateTitle={async () => true}
        canEdit={false}
      />,
    )

    expect(screen.getByLabelText(/research title/i)).toBeDisabled()
  })
})

describe('research draft persistence', () => {
  it('preserves typed form state while excluding files from local storage', () => {
    const persisted = serializeResearchDraftState({
      research_title: 'Example title',
      program_id: 1,
      research_adviser: 2,
      completed_year: 2025,
      research_abstract: 'Abstract',
      updated_at: '2025-01-01T00:00:00.000000Z',
      researchers: [{ first_name: 'Ana', last_name: 'Dela Cruz', email: 'ana@usep.edu.ph', is_lead_author: true }],
      keyword_names: ['AI'],
      approval_sheet: new File(['approval'], 'approval.pdf', { type: 'application/pdf' }),
      manuscript: new File(['manuscript'], 'manuscript.pdf', { type: 'application/pdf' }),
    })

    expect(persisted).toEqual({
      research_title: 'Example title',
      program_id: 1,
      research_adviser: 2,
      completed_year: 2025,
      research_abstract: 'Abstract',
      updated_at: '2025-01-01T00:00:00.000000Z',
      researchers: [{ first_name: 'Ana', last_name: 'Dela Cruz', email: 'ana@usep.edu.ph', is_lead_author: true }],
      keyword_names: ['AI'],
    })
  })

  it('restores persisted state from a safe storage payload', () => {
    const restored = deserializeResearchDraftState({
      research_title: 'Recovered title',
      updated_at: '2025-01-02T00:00:00.000000Z',
      researchers: [{ first_name: 'Ben', last_name: 'Santos', email: 'ben@usep.edu.ph', is_lead_author: false }],
      approval_sheet: 'should-not-be-used',
    })

    expect(restored.research_title).toBe('Recovered title')
    expect(restored.updated_at).toBe('2025-01-02T00:00:00.000000Z')
    expect(restored.researchers).toHaveLength(1)
    expect(restored.researchers?.[0].first_name).toBe('Ben')
  })

  it('builds a user and research scoped storage key', () => {
    expect(buildResearchDraftStorageKey({ userId: 7, researchId: 9, mode: 'edit' })).toBe('research-form:edit:user:7:research:9')
    expect(buildResearchDraftStorageKey({ mode: 'create' })).toBe('research-form:create:user:guest:research:new')
  })

  it('preserves form payload entries and file uploads for the confirmation save', () => {
    const original = new FormData()
    original.append('research_title', 'Example title')
    original.append('research_manuscript', new File(['content'], 'manuscript.pdf', { type: 'application/pdf' }))

    const clone = cloneFormData(original)

    expect(clone.get('research_title')).toBe('Example title')
    expect(clone.get('research_manuscript')).toBeInstanceOf(File)
    expect((clone.get('research_manuscript') as File).name).toBe('manuscript.pdf')
  })
})
