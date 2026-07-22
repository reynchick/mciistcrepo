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
  submitted: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  returned: 'bg-rose-100 text-rose-800',
  archived: 'bg-slate-200 text-slate-700',
}

export default function StatusBadge({ status, className, context }: Props) {
  const { researchStatuses } = usePage<SharedData & { researchStatuses?: Record<string, { label?: string }> }>().props
  const resolved = status ?? 'draft'
  const label = context === 'staff_metadata_request' && resolved === 'published'
    ? 'Staff metadata request'
    : researchStatuses?.[resolved]?.label ?? resolved.replace(/_/g, ' ')

  return (
    <Badge className={cn(colorMap[resolved] ?? 'bg-slate-100 text-slate-700', className)}>
      {label}
    </Badge>
  )
}
