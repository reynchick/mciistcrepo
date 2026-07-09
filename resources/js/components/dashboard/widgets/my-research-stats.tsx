import { useMemo, memo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Link, router } from '@inertiajs/react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, type ChartOptions } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

/**
 * Entry item for recent researches.
 */
interface RecentItem {
  id: number | string
  title: string
  program?: string
  status?: 'ongoing' | 'completed'
  year?: number
  role?: 'adviser' | 'panelist'
}

/**
 * Program breakdown item.
 */
interface ProgramStat { program: string; count: number }

/**
 * Yearly trend point.
 */
interface TrendPoint { year: number; count: number }

/**
 * Props for MyResearchStats widget.
 */
interface Props {
  totals: { advised: number; paneled: number }
  recent: RecentItem[]
  byProgram: ProgramStat[]
  yearlyTrend: TrendPoint[]
  completion: { ongoing: number; completed: number }
  isLoading?: boolean
  emptyMessage?: string
  lastUpdated?: string
  onAddNew?: () => void
  onViewAll?: () => void
}

const programColor: Record<string, string> = {
  BSIT: 'bg-blue-600',
  BSCS: 'bg-indigo-600',
  BLIS: 'bg-emerald-600',
  MLIS: 'bg-purple-600',
  MIT: 'bg-cyan-600',
}

function MyResearchStats({ totals, recent, byProgram, yearlyTrend, completion, isLoading = false, emptyMessage = 'No research yet', lastUpdated, onAddNew, onViewAll }: Props) {
  const hasAny = (totals?.advised ?? 0) + (totals?.paneled ?? 0) > 0

  const labels = useMemo(() => yearlyTrend.map((p) => String(p.year)), [yearlyTrend])
  const data = useMemo(() => yearlyTrend.map((p) => p.count), [yearlyTrend])
  const lineData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Count',
          data,
          borderColor: 'rgba(59,130,246,1)',
          backgroundColor: 'rgba(59,130,246,0.2)',
          tension: 0.3,
          fill: true,
          pointRadius: 2,
        },
      ],
    }),
    [labels, data]
  )

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  const handleAdd = () => (onAddNew ? onAddNew() : router.visit('/faculty/research/create'))
  const handleViewAll = () => (onViewAll ? onViewAll() : router.visit('/faculty/research'))

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold">My Research Stats</CardTitle>
          <CardDescription>Advised and paneled projects</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 md:h-10 px-3 md:px-4 text-sm" onClick={handleAdd}>Add New Research</Button>
          <Button size="sm" className="h-9 md:h-10 px-3 md:px-4 text-sm" onClick={handleViewAll}>View All My Researches</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <Skeleton className="h-36 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !hasAny ? (
          <div className="space-y-3 text-center">
            <div className="py-8 text-muted-foreground">{emptyMessage}</div>
            <Button onClick={handleAdd}>Add Your First Research</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Total Advised</div>
                <div className="text-3xl font-bold">{totals.advised}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Total Paneled</div>
                <div className="text-3xl font-bold">{totals.paneled}</div>
              </div>
              <div className="col-span-2 rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Completion Status</div>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="rounded bg-green-100/50 px-3 py-2 dark:bg-green-900/20">
                    <div className="text-xs text-muted-foreground">Completed</div>
                    <div className="text-xl font-semibold">{completion.completed}</div>
                  </div>
                  <div className="rounded bg-amber-100/50 px-3 py-2 dark:bg-amber-900/20">
                    <div className="text-xs text-muted-foreground">Ongoing</div>
                    <div className="text-xl font-semibold">{completion.ongoing}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Yearly Trend</div>
              <div className="h-36 mt-2">
                <Line data={lineData} options={options} aria-label="Yearly trend chart" />
              </div>
            </div>
            <div className="md:col-span-2 rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Program Breakdown</div>
              <div className="mt-3 flex flex-wrap gap-3">
                {byProgram.map((p) => (
                  <span key={p.program} onClick={() => router.visit(`/research?program=${encodeURIComponent(p.program)}`)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent">
                    <span className={`inline-block h-2 w-2 rounded-full ${programColor[p.program] ?? 'bg-gray-400'}`} />
                    <span className="text-sm">{p.program}</span>
                    <Badge variant="secondary">{p.count}</Badge>
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Recent Research</div>
                {lastUpdated && <div className="text-xs text-muted-foreground">Last updated {new Date(lastUpdated).toLocaleString()}</div>}
              </div>
              <div className="mt-3 grid gap-3">
                {recent.map((r) => (
                  <Link key={String(r.id)} href={`/research/${r.id}`} className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent">
                    <div className="flex items-center gap-3">
                      {r.program && <span className={`inline-block h-2 w-2 rounded-full ${programColor[r.program] ?? 'bg-gray-400'}`} />}
                      <span className="line-clamp-1">{r.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.role && <Badge variant="outline" className="text-xs capitalize">{r.role}</Badge>}
                      <div className="text-xs text-muted-foreground">{r.status ?? ''}{r.year ? ` • ${r.year}` : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="md:hidden col-span-2">
              <Collapsible>
                <CollapsibleTrigger className="w-full rounded-md border px-3 py-3 text-sm font-medium">Activity Insights</CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-3">
                  <div className="rounded-md border p-4">
                    <div className="text-sm text-muted-foreground">Program Breakdown</div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {byProgram.map((p) => (
                        <span key={p.program} onClick={() => router.visit(`/research?program=${encodeURIComponent(p.program)}`)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer">
                          <span className={`inline-block h-2 w-2 rounded-full ${programColor[p.program] ?? 'bg-gray-400'}`} />
                          <span className="text-sm">{p.program}</span>
                          <Badge variant="secondary">{p.count}</Badge>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">Recent Research</div>
                      {lastUpdated && <div className="text-xs text-muted-foreground">Last updated {new Date(lastUpdated).toLocaleString()}</div>}
                    </div>
                    <div className="mt-3 grid gap-3">
                      {recent.map((r) => (
                        <Link key={String(r.id)} href={`/research/${r.id}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div className="flex items-center gap-3">
                            {r.program && <span className={`inline-block h-2 w-2 rounded-full ${programColor[r.program] ?? 'bg-gray-400'}`} />}
                            <span className="line-clamp-1">{r.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.role && <Badge variant="outline" className="text-xs capitalize">{r.role}</Badge>}
                            <div className="text-xs text-muted-foreground">{r.status ?? ''}{r.year ? ` • ${r.year}` : ''}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(MyResearchStats)
