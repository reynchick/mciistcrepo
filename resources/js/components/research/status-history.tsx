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
  modified_by?: {
    id: number
    first_name: string
    middle_name?: string | null
    last_name: string
    role?: string | null
  } | string | null
  metadata?: Record<string, unknown>
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
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
  'post_research_entry': { label: 'Post to Repository', icon: 'check' },
  'archive_research_entry': { label: 'Archived', icon: 'alert' },
  'restore_research_entry': { label: 'Restored', icon: 'check' },
  'invite_researchers': { label: 'Researchers Invited', icon: 'users' },
  'reassign_research_adviser': { label: 'Adviser Reassigned', icon: 'users' },
  'request_adviser_metadata': { label: 'Adviser Metadata Requested', icon: 'clock' },
  'mark_legacy_unavailable': { label: 'Marked Legacy Data Unavailable', icon: 'file' },
  'hard_delete_research_entry': { label: 'Permanently Deleted', icon: 'alert' },
  'change_status_research_entry': { label: 'Status Changed', icon: 'clock' },
  'research_notification_failed': { label: 'Notification Failed', icon: 'alert' },
}

const RESEARCH_FIELD_LABELS: Record<string, string> = {
  research_title: 'Title',
  research_adviser: 'Adviser',
  program_id: 'Program',
  completed_month: 'Completed Date',
  completed_year: 'Completed Date',
  research_abstract: 'Abstract',
  research_approval_sheet: 'Approval Sheet',
  research_manuscript: 'Manuscript',
  status: 'Status',
  researchers: 'Researchers',
  keywords: 'Keywords',
  panelists: 'Panelists',
  agendas: 'Research Agendas',
  sdgs: 'SDGs',
  srigs: 'SRIGs',
}

function updateTitle(entry: ActivityEntry): string {
  const rawChanged = Array.isArray(entry.metadata?.changed)
    ? entry.metadata.changed
    : Object.keys(entry.new_values ?? {})
  const fields = [...new Set(rawChanged
    .filter((field): field is string => typeof field === 'string' && field !== 'updated_at')
    .map((field) => RESEARCH_FIELD_LABELS[field] ?? field.replace(/_/g, ' ')))]

  return fields.length > 0 ? `Research Updated (${fields.join(', ')})` : 'Research Updated'
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
    old_values: entry.old_values ?? undefined,
    new_values: entry.new_values ?? undefined,
  }))

  return (
    <ActivityTimeline
      events={events}
      userId={0}
      title="Research Activity — read-only"
      emptyTitle="Research Activity"
      emptyDescription="No research activity recorded yet"
      formatTitle={(event) => event.action_type === 'update_research_entry'
        ? updateTitle(event)
        : ACTION_TYPE_LABELS[event.action_type]?.label ?? event.action_type.replace(/_/g, ' ')}
    />
  )
}
