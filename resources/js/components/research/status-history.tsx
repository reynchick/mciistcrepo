import { useEffect, useState } from 'react'
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

  const canViewHistory = Boolean(capabilities?.canView || auth?.user?.role === 'Administrator' || auth?.user?.role === 'MCIIS Staff' || auth?.user?.role === 'Faculty' || auth?.user?.role === 'Student')

  if (!canViewHistory) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const config = ACTION_TYPE_LABELS[entry.action_type] ?? { label: entry.action_type, icon: 'file' as const }
              return (
                <div key={entry.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">{getActionIcon(entry.action_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{config.label}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{entry.modified_by ?? 'System'}</div>
                      {entry.metadata?.note && (
                        <div className="mt-2 text-xs border-l-2 border-amber-300 bg-amber-50 p-2 rounded">
                          <strong>Note:</strong> {String(entry.metadata.note)}
                        </div>
                      )}
                      {entry.metadata?.reason && (
                        <div className="mt-2 text-xs border-l-2 border-rose-300 bg-rose-50 p-2 rounded">
                          <strong>Reason:</strong> {String(entry.metadata.reason)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
