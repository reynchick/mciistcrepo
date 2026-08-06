import { useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WorkflowNoteModal from '@/components/modals/workflow-note-modal'
import ResearchSaveDecisionModal from '@/components/modals/research-save-decision-modal'
import type { SharedData } from '@/types'

type Props = {
  researchId: number
  status?: string | null
  capabilities?: Record<string, boolean>
}

const roleName = (auth: SharedData['auth'] | undefined) => auth?.user?.role ?? 'Student'

type ModalAction = 'return' | 'archive' | 'restore' | 'requestMetadata' | 'hardDelete' | null

type SaveDecisionSummary = {
  added?: Array<{ name?: string | null; email?: string | null }>
  changed_emails?: Array<{ name?: string | null; old_email?: string | null; new_email?: string | null }>
  expired?: Array<{ name?: string | null; email?: string | null }>
  archive_revoked?: Array<{ name?: string | null; email?: string | null }>
  removed?: Array<{ name?: string | null }>
}

export default function WorkflowActions({ researchId, status, capabilities }: Props) {
  const page = usePage<SharedData & { research?: { updated_at?: string | null } }>()
  const { auth, flash } = page.props
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionSummary, setDecisionSummary] = useState<SaveDecisionSummary | null>(null)
  const [removalOnly, setRemovalOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentRole = roleName(auth)
  const normalizedStatus = (status ?? 'draft').toLowerCase()
  const can = capabilities ?? {}

  const actions = useMemo(() => {
    const list: Array<{ key: string; label: string; variant?: 'default' | 'outline' | 'destructive'; onClick?: () => void }> = []

    if (currentRole === 'Student') {
      if (can.can_submit && ['draft', 'draft_invited', 'returned'].includes(normalizedStatus)) {
        list.push({ key: 'submit', label: 'Submit for review', variant: 'default', onClick: () => submitAction('submit') })
      }
    }

    if (can.can_edit || currentRole === 'Faculty') {
      if (can.can_edit) {
        list.push({ key: 'save', label: normalizedStatus === 'draft' ? 'Save draft' : 'Save changes', variant: 'outline', onClick: () => router.visit(`/research/${researchId}/edit`) })
      }
      if (normalizedStatus !== 'posted' && normalizedStatus !== 'archived') {
        if (can.can_return) {
          list.push({ key: 'return', label: 'Return', variant: 'outline', onClick: () => setModalAction('return') })
        }
        if (can.can_publish) {
          list.push({ key: 'publish', label: 'Post to repository', variant: 'default', onClick: () => submitAction('publish') })
        }
      }
      if (normalizedStatus !== 'posted' && normalizedStatus !== 'archived' && can.can_archive) {
        list.push({ key: 'archive', label: 'Archive', variant: 'destructive', onClick: () => setModalAction('archive') })
      }
    }

    if (can.can_send_invitations) {
      list.push({ key: 'invite', label: 'Invite researchers', variant: 'outline', onClick: () => submitAction('invite') })
    }

    if (can.can_request_metadata) {
      list.push({ key: 'metadata', label: 'Request adviser metadata', variant: 'outline', onClick: () => setModalAction('requestMetadata') })
    }

    if (can.can_restore) {
      list.push({ key: 'restore', label: 'Restore', variant: 'outline', onClick: () => setModalAction('restore') })
    }

    if (can.can_hard_delete) {
      list.push({ key: 'hardDelete', label: 'Hard delete', variant: 'destructive', onClick: () => setModalAction('hardDelete') })
    }

    if (can.can_submit || (currentRole === 'MCIIS Staff' || currentRole === 'Administrator')) {
      list.push({ key: 'status', label: 'Change status', variant: 'outline', onClick: () => submitAction('status') })
    }

    return list
  }, [can, currentRole, normalizedStatus, researchId])

  const submitAction = async (action: string) => {
    if (!researchId) return
    setLoading(true)
    const routeMap: Record<string, string> = {
      submit: `/research/${researchId}/submit`,
      publish: `/research/${researchId}/publish`,
      status: `/research/${researchId}/status`,
      invite: `/research/${researchId}/invite`,
    }
    if (action === 'status') {
      router.post(routeMap.status, { status: 'submitted' }, { preserveScroll: true })
      setLoading(false)
      return
    }
    router.post(routeMap[action], {}, { preserveScroll: true })
    setLoading(false)
  }

  const confirmAction = async (note: string) => {
    setLoading(true)
    const payload = note ? { note } : {}
    const routeMap: Record<string, string> = {
      return: `/research/${researchId}/return`,
      archive: `/research/${researchId}/archive`,
      restore: `/research/${researchId}/restore`,
      requestMetadata: `/research/${researchId}/request-adviser-metadata`,
      hardDelete: `/research/${researchId}/force-delete`,
    }

    if (modalAction === 'hardDelete') {
      router.post(routeMap.hardDelete, { reason: note, confirmation: 'DELETE' }, { preserveScroll: true })
    } else {
      router.post(routeMap[modalAction!], payload, { preserveScroll: true })
    }
    setLoading(false)
    setModalAction(null)
  }

  const handleSaveDecision = async (decision: 'save_only' | 'send_invitations') => {
    setLoading(true)
    const payload = {
      _method: 'put',
      invitation_action: decision,
      updated_at: page.props.research?.updated_at ?? null,
    }
    router.post(`/research/${researchId}`, payload, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setShowDecisionModal(false)
        setDecisionSummary(null)
        setRemovalOnly(false)
      },
      onError: () => setLoading(false),
    })
  }

  const actionLabel = flash?.success ? 'Updated' : 'Workflow actions'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{actionLabel}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button key={action.key} type="button" variant={action.variant ?? 'outline'} onClick={action.onClick} disabled={loading}>
              {action.label}
            </Button>
          ))}
        </CardContent>
      </Card>
      <WorkflowNoteModal open={Boolean(modalAction)} onOpenChange={(open) => !open && setModalAction(null)} action={modalAction} onConfirm={confirmAction} isLoading={loading} />
      <ResearchSaveDecisionModal open={showDecisionModal} onOpenChange={(open) => { if (!open) { setShowDecisionModal(false); setDecisionSummary(null); setRemovalOnly(false) } }} summary={decisionSummary} removalOnly={removalOnly} onChoose={handleSaveDecision} isLoading={loading} />
    </>
  )
}
