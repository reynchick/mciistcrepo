import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePage } from '@inertiajs/react'
import type { SharedData } from '@/types'

type HistoryEntry = {
  id: number
  action_type: string
  created_at?: string
  modified_by?: string | null
  metadata?: Record<string, unknown>
}

type Props = {
  researchId: number
}

export default function StatusHistory({ researchId }: Props) {
  const { auth } = usePage<SharedData>().props
  const [entries, setEntries] = useState<HistoryEntry[]>([])
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

  const isVisible = auth?.user?.role === 'Administrator' || auth?.user?.role === 'MCIIS Staff' || auth?.user?.role === 'Faculty' || auth?.user?.role === 'Student'

  if (!isVisible) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status history</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-muted-foreground">No status history yet.</div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{entry.action_type}</span>
                  <span className="text-muted-foreground">{entry.created_at ? new Date(entry.created_at).toLocaleString() : '-'}</span>
                </div>
                <div className="text-muted-foreground">{entry.modified_by ?? 'System'}</div>
                {entry.metadata?.note ? <div className="mt-2 text-sm">{String(entry.metadata.note)}</div> : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
