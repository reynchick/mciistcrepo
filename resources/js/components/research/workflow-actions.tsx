import { useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WorkflowNoteModal from '@/components/modals/workflow-note-modal'
import type { SharedData } from '@/types'
import type { ResearchCapabilities, ResearchWorkflow } from '@/types/models'
import { researchRoutes } from '@/lib/research-routes'
import { useResearchCapabilities } from '@/hooks/use-research-capabilities'

type Props = {
  researchId: number
  status?: string | null
  capabilities?: Partial<ResearchCapabilities> | null
  workflow?: ResearchWorkflow | null
  postingReadiness?: { ready: boolean; missing: string[] } | null
}

type ModalAction = 'return' | 'archive' | 'restore' | 'requestMetadata' | 'hardDelete' | null

export default function WorkflowActions({ researchId, status, capabilities, workflow, postingReadiness }: Props) {
  const page = usePage<SharedData & { research?: { updated_at?: string | null }; flash?: { success?: string | null } }>()
  const { flash } = page.props
  const [modalAction, setModalAction] = useState<ModalAction>(null)
  const [loading, setLoading] = useState(false)

  const normalizedStatus = (status ?? 'draft').toLowerCase()
  const capabilitiesState = useResearchCapabilities(capabilities)
  const can = capabilitiesState

  const actions = useMemo(() => {
    const list: Array<{ key: string; label: string; variant?: 'default' | 'outline' | 'destructive'; onClick?: () => void }> = []

    if (can.canSubmit && ['draft', 'draft_invited', 'returned'].includes(normalizedStatus)) {
      list.push({ key: 'submit', label: 'Submit for review', variant: 'default', onClick: () => submitAction('submit') })
    }

    if (can.canEdit) {
      list.push({ key: 'edit', label: normalizedStatus === 'draft' ? 'Save draft' : 'Save changes', variant: 'outline', onClick: () => router.visit(researchRoutes.edit(researchId)) })
    }

    if (normalizedStatus !== 'posted' && normalizedStatus !== 'archived') {
      if (can.canReturnForRevision) {
        list.push({ key: 'return', label: 'Return', variant: 'outline', onClick: () => setModalAction('return') })
      }
      if (can.canPost) {
        list.push({ key: 'post', label: 'Post to repository', variant: 'default', onClick: () => submitAction('post') })
      }
      if (can.canArchive) {
        list.push({ key: 'archive', label: 'Archive', variant: 'destructive', onClick: () => setModalAction('archive') })
      }
    }

    if (can.canSendInitialInvitations && (!workflow?.isRestoredDraft)) {
      list.push({ key: 'invite', label: 'Invite researchers', variant: 'outline', onClick: () => submitAction('invite') })
    }

    if (can.canRestore) {
      list.push({ key: 'restore', label: 'Restore', variant: 'outline', onClick: () => setModalAction('restore') })
    }

    if (can.canHardDelete) {
      list.push({ key: 'hardDelete', label: 'Hard delete', variant: 'destructive', onClick: () => setModalAction('hardDelete') })
    }

    return list
  }, [can, normalizedStatus, researchId, workflow?.isRestoredDraft])

  const submitAction = async (action: string) => {
    if (!researchId) return
    setLoading(true)
    const routeMap: Record<string, string> = {
      submit: researchRoutes.submit(researchId),
      post: researchRoutes.post(researchId),
      invite: researchRoutes.initialInvite(researchId),
    }

    router.post(routeMap[action], {}, { preserveScroll: true })
    setLoading(false)
  }

  const confirmAction = async (note: string) => {
    setLoading(true)
    const payload = note ? { note } : {}
    const routeMap: Record<string, string> = {
      return: researchRoutes.return(researchId),
      archive: researchRoutes.archive(researchId),
      restore: researchRoutes.restore(researchId),
      requestMetadata: researchRoutes.return(researchId),
      hardDelete: researchRoutes.hardDelete(researchId),
    }

    if (modalAction === 'hardDelete') {
      router.post(routeMap.hardDelete, { reason: note, confirmation: 'DELETE' }, { preserveScroll: true })
    } else {
      router.post(routeMap[modalAction!], payload, { preserveScroll: true })
    }
    setLoading(false)
    setModalAction(null)
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
          {postingReadiness && !postingReadiness.ready && (
            <div className="w-full text-sm text-muted-foreground">
              Missing: {postingReadiness.missing.join(', ')}
            </div>
          )}
        </CardContent>
      </Card>
      <WorkflowNoteModal open={Boolean(modalAction)} onOpenChange={(open) => !open && setModalAction(null)} action={modalAction} onConfirm={confirmAction} isLoading={loading} />
    </>
  )
}
