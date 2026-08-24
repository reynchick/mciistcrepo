import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useResearchStatus } from '@/hooks/use-research-status'

type Props = {
  status?: string | null
  className?: string
  context?: string
}

const colorMap: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  rose: 'bg-rose-100 text-rose-800',
  green: 'bg-emerald-100 text-emerald-800',
  neutral: 'bg-slate-100 text-slate-700',
}

export default function StatusBadge({ status, className, context }: Props) {
  const { resolved, label, badgeColor } = useResearchStatus(status, context)
  const colorClass = colorMap[badgeColor] ?? 'bg-slate-100 text-slate-700'

  return (
    <Badge className={cn(colorClass, className)}>
      {label}
    </Badge>
  )
}
