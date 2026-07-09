import { Badge } from '@/components/ui/badge'
import { router } from '@inertiajs/react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface Item {
  keyword: string
  count: number
  trend: 'up' | 'down' | 'flat'
}

interface Props {
  items: Item[]
}

function TrendIcon({ t }: { t: Item['trend'] }) {
  if (t === 'up') return <ArrowUp className="h-3 w-3 text-green-600" />
  if (t === 'down') return <ArrowDown className="h-3 w-3 text-red-600" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

export default function TopKeywords({ items }: Props) {
  const go = (k: string) => router.get('/', { search: k }, { preserveState: true, preserveScroll: true })
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((i) => (
        <button key={i.keyword} onClick={() => go(i.keyword)} className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-accent">
          <Badge variant="secondary">{i.keyword}</Badge>
          <span className="text-sm text-muted-foreground">{i.count}</span>
          <TrendIcon t={i.trend} />
        </button>
      ))}
    </div>
  )
}