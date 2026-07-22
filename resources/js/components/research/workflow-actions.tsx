import { useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import WorkflowNoteModal from '@/components/modals/workflow-note-modal'
import type { SharedData } from '@/types'

type Props = {
  researchId: number
  status?: string | null
  entryMode?: string | null
}

const roleName = (auth: SharedData['auth'] | undefined) => auth?.user?.role ?? 'Student'

export default function WorkflowActions({ researchId, status, entryMode }: Props) {
  const { auth } = usePage<SharedData>().props
  const [modalAction, setModalAction] = useState<'return' | 'archive' | 'restore' | 'requestMetadata' | null>(null)
  const [loading, setLoading] = useState(false)

  const currentRole = roleName(auth)
  const normalizedStatus = (status ?? 'draft').toLowerCase()

  const actions = useMemo(() => {
    const list: Array<{ key: string; label: string; variant?: 'default' | 'outline' | 'destructive'; onClick?: () => void }> = []

    if (currentRole === 'Student') {
      if (['draft', 'returned'].includes(normalizedStatus)) {
        list.push({ key: 'submit', label: 'Submit for review', variant: 'default', onClick: () => submitAction('submit') })
      }
    }

    if (currentRole === 'Faculty') {
      list.push({ key: 'save', label: 'Save', variant: 'outline', onClick: () => router.visit(`/research/${researchId}/edit`) })
      if (normalizedStatus !== 'published' && normalizedStatus !== 'archived') {
        list.push({ key: 'return', label: 'Return', variant: 'outline', onClick: () => setModalAction('return') })
        list.push({ key: 'publish', label: 'Publish', variant: 'default', onClick: () => submitAction('publish') })
      }
      if (normalizedStatus !== 'published' && normalizedStatus !== 'archived') {
        list.push({ key: 'archive', label: 'Archive', variant: 'destructive', onClick: () => setModalAction('archive') })
      }
    }

    if (currentRole === 'MCIIS Staff' || currentRole === 'Administrator') {
      if (entryMode === 'guest' || entryMode === 'faculty_student' || entryMode === 'faculty_only') {
        list.push({ key: 'metadata', label: 'Request adviser metadata', variant: 'outline', onClick: () => setModalAction('requestMetadata') })
      }
      if (normalizedStatus === 'archived') {
        list.push({ key: 'restore', label: 'Restore', variant: 'outline', onClick: () => setModalAction('restore') })
      }
      list.push({ key: 'status', label: 'Change status', variant: 'outline', onClick: () => submitAction('status') })
    }

    return list
  }, [currentRole, entryMode, normalizedStatus, researchId])

  const submitAction = async (action: string) => {
    if (!researchId) return
    setLoading(true)
    const routeMap: Record<string, string> = {
      submit: `/research/${researchId}/submit`,
      publish: `/research/${researchId}/publish`,
      status: `/research/${researchId}/status`,
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
    }
    router.post(routeMap[modalAction!], payload, { preserveScroll: true })
    setLoading(false)
    setModalAction(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Workflow actions</CardTitle>
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
    </>
  )
}
