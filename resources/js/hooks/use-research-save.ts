import { useCallback, useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'
import type { SharedData } from '@/types'
import type { ResearcherChangeSummary, SaveDecisionRequired } from '@/types/models'

type ResearchSaveProps = {
  researchId?: number | null
  initialUpdatedAt?: string | null
  buildFormData: (decision?: 'save_only' | 'send_invitations') => FormData
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

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/research/${researchId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: buildFormData(decision),
      })

      if (response.ok) {
        const json = await response.json().catch(() => null) as SaveDecisionRequired | { success?: boolean } | null
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
