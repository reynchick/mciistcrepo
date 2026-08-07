import { useCallback, useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'
import type { SharedData } from '@/types'
import type { ResearcherChangeSummary, SaveDecisionRequired } from '@/types/models'

type ResearchSaveProps = {
  researchId?: number | null
  initialUpdatedAt?: string | null
  buildFormData: (decision?: 'save_only' | 'send_invitations') => FormData
}

export type ResearchDraftState = {
  research_title?: string
  program_id?: number | null
  research_adviser?: number | null
  completed_month?: number | null
  completed_year?: number | null
  research_abstract?: string
  updated_at?: string | null
  researchers?: Array<{
    id?: number
    first_name: string
    middle_name?: string
    last_name: string
    email: string
    is_lead_author?: boolean
  }>
  keyword_names?: string[]
  agendas?: number[]
  sdgs?: number[]
  srigs?: number[]
  panelists?: number[]
}

type DraftStorageContext = {
  userId?: number | null
  researchId?: number | null
  mode: 'create' | 'edit'
}

export function buildResearchDraftStorageKey({ userId, researchId, mode }: DraftStorageContext) {
  const userKey = userId ?? 'guest'
  const researchKey = researchId ?? 'new'
  return `research-form:${mode}:user:${userKey}:research:${researchKey}`
}

export function serializeResearchDraftState<T extends Record<string, unknown>>(state: T): ResearchDraftState {
  const { approval_sheet: _approvalSheet, manuscript: _manuscript, ...draft } = state as Record<string, unknown> & {
    approval_sheet?: unknown
    manuscript?: unknown
  }

  return draft as ResearchDraftState
}

export function deserializeResearchDraftState<T>(value: unknown): Partial<T> {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const draft = value as Record<string, unknown>

  return {
    ...draft,
    researchers: Array.isArray(draft.researchers) ? (draft.researchers as ResearchDraftState['researchers']) : undefined,
    keyword_names: Array.isArray(draft.keyword_names) ? (draft.keyword_names as string[]) : undefined,
    agendas: Array.isArray(draft.agendas) ? (draft.agendas as number[]) : undefined,
    sdgs: Array.isArray(draft.sdgs) ? (draft.sdgs as number[]) : undefined,
    srigs: Array.isArray(draft.srigs) ? (draft.srigs as number[]) : undefined,
    panelists: Array.isArray(draft.panelists) ? (draft.panelists as number[]) : undefined,
  } as Partial<T>
}

export function useResearchSave({ researchId, initialUpdatedAt, buildFormData }: ResearchSaveProps) {
  const { props } = usePage<SharedData & { research?: { updated_at?: string | null } }>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [decisionSummary, setDecisionSummary] = useState<ResearcherChangeSummary | null>(null)
  const [removalOnly, setRemovalOnly] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updatedAt = useMemo(() => initialUpdatedAt ?? props.research?.updated_at ?? null, [initialUpdatedAt, props.research?.updated_at])

  const submit = useCallback(async (decision?: 'save_only' | 'send_invitations') => {
    if (!researchId) return false

    const formData = buildFormData(decision)

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/research/${researchId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      })

      if (response.ok) {
        const json = (await response.json().catch(() => null)) as SaveDecisionRequired | { success?: boolean } | null
        if (json && 'invitation_decision_required' in json && json.invitation_decision_required) {
          setDecisionSummary(json.summary ?? null)
          setRemovalOnly(Boolean(json.removal_only))
          setDecisionOpen(true)
          setIsProcessing(false)
          return true
        }

        setDecisionOpen(false)
        setDecisionSummary(null)
        setRemovalOnly(false)
        window.location.reload()
        return true
      }

      const json = await response.json().catch(() => null)
      if (json?.errors?.updated_at) {
        setErrorMessage('Record updated by another user')
      } else {
        setErrorMessage('Unable to save research right now')
      }
      return false
    } catch {
      setErrorMessage('Unable to save research right now')
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [buildFormData, researchId])

  return {
    updatedAt,
    isProcessing,
    decisionOpen,
    setDecisionOpen,
    decisionSummary,
    setDecisionSummary,
    removalOnly,
    setRemovalOnly,
    errorMessage,
    submit,
  }
}
