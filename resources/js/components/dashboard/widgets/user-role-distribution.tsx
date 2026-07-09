import { useMemo, useRef, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { router } from '@inertiajs/react'
import { Shield, Building2, GraduationCap, User2 } from 'lucide-react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions, type TooltipItem } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

/**
 * Widget to visualize user account distribution across roles.
 */
interface RoleItem {
  role: 'Administrator' | 'MCIIS Staff' | 'Faculty' | 'Student'
  count: number
}

/**
 * Props for UserRoleDistribution component.
 */
interface Props {
  items: RoleItem[]
  isLoading?: boolean
  emptyMessage?: string
  lastUpdated?: string
}

const roleColor: Record<RoleItem['role'], string> = {
  Administrator: '#4F46E5',
  'MCIIS Staff': '#F59E0B',
  Faculty: '#10B981',
  Student: '#06B6D4',
}

const RoleIcon = ({ role, className }: { role: RoleItem['role']; className?: string }) => {
  if (role === 'Administrator') return <Shield className={className} />
  if (role === 'MCIIS Staff') return <Building2 className={className} />
  if (role === 'Faculty') return <GraduationCap className={className} />
  return <User2 className={className} />
}

function percentage(count: number, total: number) {
  if (total === 0) return 0
  return Math.round((count / total) * 100)
}

function navigateToRole(role: RoleItem['role']) {
  router.visit('/admin/users', { data: { role }, preserveScroll: true })
}

function UserRoleDistribution({ items, isLoading = false, emptyMessage = 'No users found', lastUpdated }: Props) {
  const total = useMemo(() => items.reduce((acc, i) => acc + i.count, 0), [items])
  const labels = useMemo(() => items.map((i) => i.role), [items])
  const counts = useMemo(() => items.map((i) => i.count), [items])
  const colors = useMemo(() => items.map((i) => roleColor[i.role]), [items])
  const chartRef = useRef<ChartJS<'doughnut', number[], string> | null>(null)

  const hasData = items.length > 0 && total > 0

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          hoverBackgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    }),
    [labels, counts, colors]
  )

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'doughnut'>) => {
            const c = ctx.parsed as number
            const pct = percentage(c, total)
            const lbl = String(ctx.label)
            return `${lbl}: ${c} (${pct}%)`
          },
        },
      },
    },
  }

  const onChartClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const chart = chartRef.current
    if (!chart) return
    const points = chart.getElementsAtEventForMode(e.nativeEvent as unknown as Event, 'nearest', { intersect: true }, true)
    if (!points || points.length === 0) return
    const idx = points[0].index
    const role = labels[idx] as RoleItem['role']
    navigateToRole(role)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold">User Role Distribution</CardTitle>
          <CardDescription>Accounts by role</CardDescription>
        </div>
        <Button variant="outline" size="sm" aria-label="View all users" onClick={() => router.visit('/admin/users')}>View Users</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-6 sm:grid-cols-2">
              <Skeleton className="h-64 w-full" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-60" />
              </div>
            </div>
          </div>
        ) : !hasData ? (
          <div className="text-center py-12 text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="h-64">
              <Doughnut ref={chartRef} data={data} options={options} onClick={onChartClick} aria-label="User role chart" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="text-2xl font-bold">{total}</span>
              </div>
              <div className="grid gap-3" role="list" aria-label="Role breakdown">
                {items.map((i) => (
                  <button
                    key={i.role}
                    onClick={() => navigateToRole(i.role)}
                    className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`View ${i.role} accounts`}
                  >
                    <div className="flex items-center gap-3">
                      <RoleIcon role={i.role} className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{i.role}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{percentage(i.count, total)}%</span>
                      <span className="font-semibold" style={{ color: roleColor[i.role] }}>{i.count}</span>
                    </div>
                  </button>
                ))}
              </div>
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

export default memo(UserRoleDistribution)
