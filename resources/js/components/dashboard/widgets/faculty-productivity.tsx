import { useMemo, useState, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { router } from '@inertiajs/react'

/**
 * Faculty productivity entry.
 */
interface FacultyEntry {
  id: number | string
  firstName: string
  lastName: string
  avatarUrl?: string
  advisedCount: number
  paneledCount: number
}

/**
 * Props for FacultyProductivity widget.
 */
interface Props {
  items: FacultyEntry[]
  isLoading?: boolean
  emptyMessage?: string
  onViewAll?: () => void
  lastUpdated?: string
}

function initials(first: string, last: string) {
  return `${(first || '').slice(0, 1)}${(last || '').slice(0, 1)}`.toUpperCase()
}

function total(entry: FacultyEntry) {
  return entry.advisedCount + entry.paneledCount
}

function FacultyProductivity({ items, isLoading = false, emptyMessage = 'No faculty data available', onViewAll, lastUpdated }: Props) {
  const [sortBy, setSortBy] = useState<'advised' | 'paneled'>('advised')

  const sorted = useMemo(() => {
    const arr = [...items]
    arr.sort((a, b) => (sortBy === 'advised' ? b.advisedCount - a.advisedCount : b.paneledCount - a.paneledCount))
    return arr.slice(0, 5)
  }, [items, sortBy])

  const maxTotal = useMemo(() => (sorted.length ? Math.max(...sorted.map((i) => total(i))) : 0), [sorted])
  const avgTotal = useMemo(() => {
    if (!sorted.length) return 0
    return Math.round(sorted.reduce((acc, i) => acc + total(i), 0) / sorted.length)
  }, [sorted])

  const hasData = sorted.length > 0

  const viewProfile = (id: FacultyEntry['id']) => router.visit(`/faculty/${id}`, { preserveScroll: true })

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold">Top Productive Faculty</CardTitle>
          <CardDescription>Advising and paneling involvement</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={sortBy} onValueChange={(v) => v && setSortBy(v as 'advised' | 'paneled')} aria-label="Sort faculty">
            <ToggleGroupItem value="advised" aria-label="Sort by advised" className="h-9 md:h-10 px-3 md:px-4 text-sm">Advised</ToggleGroupItem>
            <ToggleGroupItem value="paneled" aria-label="Sort by paneled" className="h-9 md:h-10 px-3 md:px-4 text-sm">Paneled</ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" size="sm" className="h-9 md:h-10 px-3 md:px-4 text-sm" onClick={onViewAll ?? (() => router.visit('/admin/faculty'))}>View All Faculty</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : !hasData ? (
          <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div>
            <div className="md:hidden">
              <Collapsible>
                <CollapsibleTrigger className="w-full rounded-md border px-3 py-3 text-sm font-medium">Top Productive Faculty</CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-4">
                  {sorted.map((f, idx) => {
                    const t = total(f)
                    const pct = maxTotal ? Math.round((t / maxTotal) * 100) : 0
                    const rel = t - avgTotal
                    return (
                      <button
                        key={String(f.id)}
                        onClick={() => viewProfile(f.id)}
                        className="w-full rounded-md border p-4 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`View profile of ${f.firstName} ${f.lastName}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                          <Avatar>
                            {f.avatarUrl ? (
                              <AvatarImage src={f.avatarUrl} alt={`${f.firstName} ${f.lastName}`} />
                            ) : (
                              <AvatarFallback>{initials(f.firstName, f.lastName)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium line-clamp-1">{f.firstName} {f.lastName}</div>
                              <div className="text-sm text-muted-foreground">Total {t}</div>
                            </div>
                            <div className="mt-2 h-2 w-full rounded bg-muted">
                              <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center justify-between"><span>Advised</span><span className="font-medium text-foreground">{f.advisedCount}</span></div>
                              <div className="flex items-center justify-between"><span>Paneled</span><span className="font-medium text-foreground">{f.paneledCount}</span></div>
                              <div className="flex items-center justify-between"><span>vs Avg</span><span className={rel >= 0 ? 'text-green-600' : 'text-red-600'}>{rel >= 0 ? `+${rel}` : rel}</span></div>
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                  {lastUpdated && (
                    <div className="text-xs text-muted-foreground">Last updated {new Date(lastUpdated).toLocaleString()}</div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
            <div className="hidden md:block space-y-4">
              {sorted.map((f, idx) => {
                const t = total(f)
                const pct = maxTotal ? Math.round((t / maxTotal) * 100) : 0
                const rel = t - avgTotal
                return (
                  <button
                    key={String(f.id)}
                    onClick={() => viewProfile(f.id)}
                    className="w-full rounded-md border p-4 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`View profile of ${f.firstName} ${f.lastName}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                      <Avatar>
                        {f.avatarUrl ? (
                          <AvatarImage src={f.avatarUrl} alt={`${f.firstName} ${f.lastName}`} />
                        ) : (
                          <AvatarFallback>{initials(f.firstName, f.lastName)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium line-clamp-1">{f.firstName} {f.lastName}</div>
                          <div className="text-sm text-muted-foreground">Total {t}</div>
                        </div>
                        <div className="mt-2 h-2 w-full rounded bg-muted">
                          <div className="h-2 rounded bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between"><span>Advised</span><span className="font-medium text-foreground">{f.advisedCount}</span></div>
                          <div className="flex items-center justify-between"><span>Paneled</span><span className="font-medium text-foreground">{f.paneledCount}</span></div>
                          <div className="flex items-center justify-between"><span>vs Avg</span><span className={rel >= 0 ? 'text-green-600' : 'text-red-600'}>{rel >= 0 ? `+${rel}` : rel}</span></div>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
              {lastUpdated && (
                <div className="text-xs text-muted-foreground">Last updated {new Date(lastUpdated).toLocaleString()}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(FacultyProductivity)
