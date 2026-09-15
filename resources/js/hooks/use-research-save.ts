import { useCallback, useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'
import type { SharedData } from '@/types'

export function cloneFormData(formData: FormData): FormData {
  const clone = new FormData()
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      clone.append(key, value)
      continue
    }

    clone.append(key, value)
  }

  return clone
}

function responseErrorMessage(payload: unknown, status: number): string {
  if (status === 419) return 'Your session has expired. Refresh this page, then try again.'
  if (payload && typeof payload === 'object') {
    const response = payload as { message?: unknown; errors?: Record<string, unknown> }
    const firstFieldError = Object.values(response.errors ?? {})
      .flatMap((error) => Array.isArray(error) ? error : [error])
      .find((error): error is string => typeof error === 'string' && error.trim() !== '')

    if (firstFieldError) return firstFieldError
    if (typeof response.message === 'string' && response.message.trim() !== '') return response.message
  }

  return `Unable to save research (request failed with status ${status}).`
}

type ResearchSaveProps = {
  researchId?: number | null
  initialUpdatedAt?: string | null
  buildFormData: () => FormData
  onSuccess?: () => void | Promise<void>
  onConflict?: () => void | Promise<void>
  onError?: (message: string) => void | Promise<void>
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
  const { manuscript: _manuscript, ...draft } = state as Record<string, unknown> & {
    manuscript?: unknown
  }

  return draft as ResearchDraftState
}

export function deserializeResearchDraftState<T extends Record<string, unknown> = ResearchDraftState>(value: unknown): Partial<T> {
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
  } as unknown as Partial<T>
}

export function useResearchSave({ researchId, initialUpdatedAt, buildFormData, onSuccess, onConflict, onError }: ResearchSaveProps) {
  const { props } = usePage<SharedData & { research?: { updated_at?: string | null } }>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmedFormData, setConfirmedFormData] = useState<FormData | null>(null)

  const updatedAt = useMemo(() => initialUpdatedAt ?? props.research?.updated_at ?? null, [initialUpdatedAt, props.research?.updated_at])

  const submit = useCallback(async () => {
    if (!researchId) return false

    const baseFormData = confirmedFormData ?? buildFormData()
    const requestBody = cloneFormData(baseFormData)
    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content
    if (csrfToken) requestBody.set('_token', csrfToken)

    if (!confirmedFormData) {
      setConfirmedFormData(cloneFormData(baseFormData))
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/research/${researchId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: requestBody,
      })

      if (response.ok) {
        setConfirmedFormData(null)
        await onSuccess?.()
        return true
      }

      const json = await response.json().catch(() => null)
      if (json?.errors?.updated_at) {
        const message = responseErrorMessage(json, response.status)
        setErrorMessage(message)
        await onConflict?.()
      } else {
        const message = responseErrorMessage(json, response.status)
        setErrorMessage(message)
        await onError?.(message)
      }
      return false
    } catch (error) {
      const message = error instanceof Error && error.message
        ? `Unable to save research: ${error.message}`
        : 'Unable to save research because the network request failed.'
      setErrorMessage(message)
      await onError?.(message)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [buildFormData, confirmedFormData, onConflict, onError, onSuccess, researchId])

  return {
    updatedAt,
    isProcessing,
    errorMessage,
    confirmedFormData,
    submit,
  }
}
