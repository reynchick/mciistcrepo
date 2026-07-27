import { memo } from 'react'
import { Trophy, Medal, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type RankingEntry = {
  id: number | string
  name: string
  count: number
}

interface Props {
  title: string
  subtitle: string
  entries: RankingEntry[]
  emptyMessage: string
  /** Label rendered under each count, e.g. "researches". */
  unit?: string
}

/**
 * Medal treatment for the top three rows. Ranks 4+ fall through to a plain
 * "#n" indicator. Colours are theme-aware for both light and dark.
 */
const TOP_RANKS: Array<{ icon: LucideIcon; iconColor: string }> = [
  { icon: Trophy, iconColor: 'text-yellow-500' },
  { icon: Medal, iconColor: 'text-slate-400' },
  { icon: Medal, iconColor: 'text-amber-700 dark:text-amber-600' },
]

function FacultyRanking({ title, subtitle, entries, emptyMessage, unit = 'researches' }: Props) {
  return (
    <section aria-label={title}>
      <header className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </header>

      {entries.length === 0 ? (
        <div className="flex min-h-[8rem] items-center justify-center py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, idx) => {
            const top = TOP_RANKS[idx]
            const Icon = top?.icon
            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border border-transparent p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {top && Icon ? (
                    <Icon className={cn('h-5 w-5', top.iconColor)} aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">#{idx + 1}</span>
                  )}
                  <span className="sr-only">Rank {idx + 1}</span>
                </span>

                <span className="min-w-0 flex-1 truncate font-medium">{entry.name}</span>

                <span className="shrink-0 text-right">
                  <span className="block text-lg font-bold leading-tight">{entry.count}</span>
                  <span className="block text-xs text-muted-foreground">{unit}</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default memo(FacultyRanking)
