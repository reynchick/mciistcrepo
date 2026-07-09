import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip as ChartTooltip, Legend, type ChartOptions } from 'chart.js'
import MyResearchStats from '@/components/dashboard/widgets/my-research-stats'
import { Award, Users, ClipboardList } from 'lucide-react'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, ChartTooltip, Legend)

type FacultyStats = {
  totals: { advised: number; paneled: number }
  recent: Array<{ id: number | string; title: string; program?: string; status?: 'ongoing' | 'completed'; year?: number; role?: 'adviser' | 'panelist' }>
  byProgram: Array<{ program: string; count: number }>
  byProgramAdvised?: Array<{ program: string; count: number }>
  byProgramPaneled?: Array<{ program: string; count: number }>
  yearlyTrendAdvised?: Array<{ year: number; count: number }>
  yearlyTrendPaneled?: Array<{ year: number; count: number }>
  roleSplit: { advised_pct: number; paneled_pct: number }
  rank?: { value?: number | null; percentile?: number | null; department_avg?: number | null; position?: string | null }
  completion?: { ongoing: number; completed: number }
  lastUpdated?: string
}

type SharedData = { auth: { user: { first_name: string; middle_name?: string | null; last_name: string; faculty_id?: number | string | null } } }

type Props = { facultyStats?: FacultyStats }

export default function FacultyDashboard({ facultyStats }: Props) {
  const fs: FacultyStats = facultyStats ?? {
    totals: { advised: 0, paneled: 0 },
    recent: [],
    byProgram: [],
    byProgramAdvised: [],
    byProgramPaneled: [],
    yearlyTrendAdvised: [],
    yearlyTrendPaneled: [],
    roleSplit: { advised_pct: 0, paneled_pct: 0 },
    rank: { value: null, percentile: null, department_avg: null, position: null },
    completion: { ongoing: 0, completed: 0 },
    lastUpdated: '',
  }
  const { auth } = usePage<SharedData>().props
  const name = useMemo(() => `${auth.user.first_name} ${auth.user.middle_name ? auth.user.middle_name + ' ' : ''}${auth.user.last_name}`.trim(), [auth])

  const combinedTrend = useMemo(() => {
    const map = new Map<number, number>()
    ;(fs.yearlyTrendAdvised ?? []).forEach(({ year, count }) => map.set(year, (map.get(year) ?? 0) + count))
    ;(fs.yearlyTrendPaneled ?? []).forEach(({ year, count }) => map.set(year, (map.get(year) ?? 0) + count))
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }))
  }, [fs])

  const formatTrendDelta = (series?: Array<{ year: number; count: number }>) => {
    if (!series || series.length === 0) return '—'
    const nowYear = new Date().getFullYear()
    const thisYear = series.find((s) => s.year === nowYear)?.count ?? 0
    const lastYear = series.find((s) => s.year === nowYear - 1)?.count ?? 0
    const diff = thisYear - lastYear
    if (diff > 0) return `↑ +${diff} vs last year`
    if (diff < 0) return `↓ ${diff} vs last year`
    return '→ same as last year'
  }

  const byYearData = useMemo(() => {
    const years = Array.from(new Set([...(fs.yearlyTrendAdvised ?? []).map((a) => a.year), ...(fs.yearlyTrendPaneled ?? []).map((p) => p.year)])).sort((a, b) => a - b)
    return {
      labels: years.map(String),
      datasets: [
        { label: 'Advised', data: years.map((y) => fs.yearlyTrendAdvised?.find((a) => a.year === y)?.count ?? 0), backgroundColor: 'rgba(59,130,246,0.7)' },
        { label: 'Paneled', data: years.map((y) => fs.yearlyTrendPaneled?.find((p) => p.year === y)?.count ?? 0), backgroundColor: 'rgba(16,185,129,0.7)' },
      ],
    }
  }, [fs])

  const barOptions: ChartOptions<'bar'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } }

  return (
    <AppLayout>
      <Head title="Dashboard" />
      <div className="space-y-6 p-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {name}</h1>

        <MyResearchStats totals={fs.totals} recent={fs.recent} byProgram={fs.byProgram} yearlyTrend={combinedTrend} completion={fs.completion ?? { ongoing: 0, completed: 0 }} lastUpdated={fs.lastUpdated} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />Research Advised</CardTitle>
              <CardDescription>Projects you advised</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{fs.totals.advised}</div>
                <div className="text-sm text-muted-foreground">{formatTrendDelta(fs.yearlyTrendAdvised)}</div>
              </div>
              <div className="mt-3"><Button variant="outline" size="sm" onClick={() => router.get('/research', { adviser: (auth.user.faculty_id ?? '') }, { preserveScroll: true })}>View All Advised</Button></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Research Paneled</CardTitle>
              <CardDescription>Projects you paneled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{fs.totals.paneled}</div>
                <div className="text-sm text-muted-foreground">{formatTrendDelta(fs.yearlyTrendPaneled)}</div>
              </div>
              <div className="mt-3"><Button variant="outline" size="sm" onClick={() => router.get('/research', { panelist: (auth.user.faculty_id ?? '') }, { preserveScroll: true })}>View All Paneled</Button></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4" />Total Contributions</CardTitle>
              <CardDescription>Advised + Paneled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{fs.totals.advised + fs.totals.paneled}</div>
                <div className="text-xs text-muted-foreground">{fs.rank?.percentile ? `Top ${Math.round(100 - fs.rank.percentile)}% in ${fs.rank?.position ?? 'department'}` : ''}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>By Program</CardTitle>
              <CardDescription>Distribution of your involvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <Doughnut data={{ labels: fs.byProgram.map((p) => p.program), datasets: [{ data: fs.byProgram.map((p) => p.count), backgroundColor: fs.byProgram.map((_p, i) => palette(i)) }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>By Year</CardTitle>
              <CardDescription>Advised vs Paneled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <Bar data={byYearData} options={barOptions} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>By Role</CardTitle>
            <CardDescription>Advised vs Paneled percentage split</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="text-xs">Advised</div>
              <div className="h-2 w-full bg-muted rounded"><div className="h-2 bg-blue-500 rounded" style={{ width: `${fs.roleSplit.advised_pct}%` }} /></div>
              <div className="text-xs">Paneled</div>
              <div className="h-2 w-full bg-muted rounded"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${fs.roleSplit.paneled_pct}%` }} /></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => router.visit('/research/create')}>Add New Research</Button>
              <Button variant="outline" onClick={() => router.get('/research', { adviser: (auth.user.faculty_id ?? ''), panelist: (auth.user.faculty_id ?? '') }, { preserveScroll: true })}>View My Researches</Button>
              <Button variant="outline" onClick={() => router.visit('/settings/profile')}>Edit My Profile</Button>
              <Button variant="outline" onClick={() => router.visit('/reports?type=faculty')}>Generate My Report</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

function palette(i: number) {
  const colors = ['#3b82f6', '#6366f1', '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#84cc16', '#db2777']
  return colors[i % colors.length]
}
