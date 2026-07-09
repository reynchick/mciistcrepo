import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

type Size = 'sm' | 'md' | 'lg'

type Props = {
  title: string
  value: string | number
  change?: { value: number; positive?: boolean }
  icon?: React.ComponentType<{ className?: string }>
  size?: Size
  onClick?: () => void
  chart?: { labels: string[]; values: number[] } | null
  loading?: boolean
  className?: string
}

export default function StatCard({ title, value, change, icon, size = 'md', onClick, chart, loading, className }: Props) {
  const Icon = icon
  const textSize = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'
  const padding = size === 'sm' ? 'p-3' : size === 'md' ? 'p-4' : 'p-6'
  return (
    <Card className={cn('cursor-pointer', className)} onClick={onClick}>
      <CardHeader className={cn('flex flex-row items-center justify-between', padding)}>
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && <Icon className="size-5 text-muted-foreground" />}
      </CardHeader>
      <CardContent className={padding}>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className={cn('font-semibold', textSize)}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
            {change && (
              <div className={cn('flex items-center gap-1 text-xs', change.positive ? 'text-emerald-600' : 'text-red-600')}>
                {change.positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                <span>{Math.abs(change.value)}%</span>
                <span className="text-muted-foreground">from last period</span>
              </div>
            )}
            {chart && chart.values.length > 0 && (
              <MiniSparkline values={chart.values} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MiniSparkline({ values }: { values: number[] }) {
  const w = 160
  const h = 40
  const max = Math.max(...values)
  const min = Math.min(...values)
  const norm = values.map((v) => (h - 4) - ((v - min) / (max - min || 1)) * (h - 8))
  const step = w / Math.max(1, values.length - 1)
  const d = norm.map((y, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${y}`).join(' ')
  return (
    <svg width={w} height={h} className="mt-2">
      <path d={d} strokeWidth={2} stroke="currentColor" fill="none" className="text-muted-foreground" />
    </svg>
  )
}

export type { Props as StatCardProps, Size as StatCardSize }
