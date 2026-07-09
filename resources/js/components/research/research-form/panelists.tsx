import { useMemo, useState } from 'react'
import type { Faculty } from '@/types'
import PanelistSelect from '@/components/research/panelist-select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Props = {
  faculties: Faculty[]
  adviserId?: number
  panelistIds: number[]
  onChange: (ids: number[]) => void
  error?: string
  min?: number
  max?: number
}

export default function PanelistsSection({ faculties, adviserId, panelistIds, onChange, error, min = 0, max = 6 }: Props) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return faculties
      .filter((f) => (adviserId ? f.id !== adviserId : true))
      .filter((f) => {
        if (!q) return true
        const name = [f.last_name, f.first_name, f.middle_name].filter(Boolean).join(' ').toLowerCase()
        const spec = (f.field_of_specialization ?? '').toLowerCase()
        const pos = (f.position ?? '').toLowerCase()
        const des = (f.designation ?? '').toLowerCase()
        return name.includes(q) || spec.includes(q) || pos.includes(q) || des.includes(q)
      })
  }, [faculties, adviserId, query])

  const remove = (id: number) => {
    onChange(panelistIds.filter((x) => x !== id))
  }

  const canAddMore = max ? panelistIds.length < max : true

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search and select panelists</Label>
        <PanelistSelect faculties={filtered} selectedIds={panelistIds} onChange={onChange} disabled={!canAddMore} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="text-xs text-muted-foreground">{panelistIds.length} selected{min ? ` • minimum ${min}` : ''}{max ? ` • maximum ${max}` : ''}</div>
      </div>

      <div className="space-y-2">
        <Label>Filters</Label>
        <input className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none" placeholder="Filter by name, position, specialization" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {panelistIds.map((id) => {
          const f = faculties.find((x) => x.id === id)
          const label = f ? [f.last_name, f.first_name].filter(Boolean).join(', ') : `ID ${id}`
          const subtitle = f?.position ?? f?.designation ?? f?.field_of_specialization ?? ''
          return (
            <Badge key={id} variant="secondary" className="gap-2">
              <span>{label}</span>
              {subtitle && <span className="text-xs text-muted-foreground">• {subtitle}</span>}
              <Button type="button" variant="outline" className="h-6 px-2 text-xs" onClick={() => remove(id)}>Remove</Button>
            </Badge>
          )
        })}
        {panelistIds.length === 0 && <div className="text-sm text-muted-foreground">No panelists selected</div>}
      </div>
    </div>
  )
}
