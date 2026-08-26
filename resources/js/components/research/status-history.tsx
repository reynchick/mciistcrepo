import { useEffect, useState } from 'react'
import ActivityTimeline, { type ActivityEvent } from '@/components/user/activity-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePage } from '@inertiajs/react'
import { AlertCircle, CheckCircle, Clock, FileText, Users } from 'lucide-react'
import type { SharedData } from '@/types'
import type { ResearchCapabilities } from '@/types/models'

type ActivityEntry = {
  id: number
  action_type: string
  created_at?: string
  modified_by?: string | null
  metadata?: Record<string, unknown>
}

type Props = {
  researchId: number
  capabilities?: Partial<ResearchCapabilities> | null
}

const ACTION_TYPE_LABELS: Record<string, { label: string; icon: 'check' | 'clock' | 'alert' | 'users' | 'file' }> = {
  'create_research_entry': { label: 'Research Created', icon: 'file' },
  'update_research_entry': { label: 'Research Updated', icon: 'file' },
  'submit_research_entry': { label: 'Submitted for Review', icon: 'check' },
  'return_research_entry': { label: 'Returned for Revision', icon: 'alert' },
  'return_research_entry_': { label: 'Returned for Revision', icon: 'alert' },
  'post_research_entry': { label: 'Posted to Repository', icon: 'check' },
  'archive_research_entry': { label: 'Archived', icon: 'alert' },
  'restore_research_entry': { label: 'Restored', icon: 'check' },
  'invite_researchers': { label: 'Researchers Invited', icon: 'users' },
  'reassign_research_adviser': { label: 'Adviser Reassigned', icon: 'users' },
  'request_adviser_metadata': { label: 'Adviser Metadata Requested', icon: 'clock' },
  'hard_delete_research_entry': { label: 'Permanently Deleted', icon: 'alert' },
  'change_status_research_entry': { label: 'Status Changed', icon: 'clock' },
}

function getActionIcon(action: string) {
  const config = ACTION_TYPE_LABELS[action] ?? { icon: 'file' }
  switch (config.icon) {
    case 'check':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'alert':
      return <AlertCircle className="h-4 w-4 text-amber-600" />
    case 'users':
      return <Users className="h-4 w-4 text-blue-600" />
    case 'clock':
      return <Clock className="h-4 w-4 text-slate-600" />
    default:
      return <FileText className="h-4 w-4 text-slate-600" />
  }
}

export default function StatusHistory({ researchId, capabilities }: Props) {
  const { auth } = usePage<SharedData>().props
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const canViewCapability = capabilities?.canView ?? (capabilities as (Partial<ResearchCapabilities> & { can_view?: boolean }) | null | undefined)?.can_view

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch(`/research/${researchId}/status-history`, { headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error('Failed to load history')
        const payload = await response.json()
        if (!cancelled) setEntries(payload.data ?? [])
      } catch {
        if (!cancelled) setEntries([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [researchId])

  const canViewHistory = canViewCapability !== undefined
    ? Boolean(canViewCapability)
    : Boolean(auth?.user?.role === 'Administrator' || auth?.user?.role === 'MCIIS Staff' || auth?.user?.role === 'Faculty' || auth?.user?.role === 'Student')

  if (!canViewHistory) return null

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Research Activity — read-only</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading…</div>
        </CardContent>
      </Card>
    )
  }

  const events: ActivityEvent[] = entries.map((entry) => ({
    id: entry.id,
    action_type: entry.action_type,
    created_at: entry.created_at ?? new Date(0).toISOString(),
    modified_by: entry.modified_by,
    metadata: entry.metadata,
  }))

  return (
    <ActivityTimeline
      events={events}
      userId={0}
      title="Research Activity — read-only"
      emptyTitle="Research Activity"
      emptyDescription="No research activity recorded yet"
      formatTitle={(event) => ACTION_TYPE_LABELS[event.action_type]?.label ?? event.action_type.replace(/_/g, ' ')}
    />
  )
}
