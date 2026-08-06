import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { usePage } from '@inertiajs/react'
import type { SharedData } from '@/types'

type Props = {
  status?: string | null
  className?: string
  context?: string
}

const colorMap: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  draft_invited: 'bg-blue-100 text-blue-800',
  submitted: 'bg-amber-100 text-amber-800',
  returned: 'bg-rose-100 text-rose-800',
  posted: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-200 text-slate-700',
}

export default function StatusBadge({ status, className, context }: Props) {
  const { researchStatuses } = usePage<SharedData & { researchStatuses?: Record<string, { label?: string; badge?: string }> }>().props
  const resolved = (status ?? 'draft').toLowerCase()
  const label = context === 'staff_metadata_request' && resolved === 'posted'
    ? 'Staff metadata request'
    : researchStatuses?.[resolved]?.label ?? resolved.replace(/_/g, ' ')

  return (
    <Badge className={cn(colorMap[resolved] ?? 'bg-slate-100 text-slate-700', className)}>
      {label}
    </Badge>
  )
}
