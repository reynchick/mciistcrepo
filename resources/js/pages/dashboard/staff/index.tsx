import { useMemo, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Award } from 'lucide-react'

type StaffLeaderboardEntry = { id: number; name: string; position?: string; advised: number; paneled: number; total: number; programBreakdown: { advised: Array<{ program_id: number; count: number }>; paneled: Array<{ program_id: number; count: number }> } }
type StaffSummary = { total_active_faculty: number; avg_research_per_faculty: number; faculty_without_involvement: number; most_active_program_this_month?: string | null }
type StaffQuick = { research_week: number; research_month: number; unaligned_month: number; recent: Array<{ id: number; title: string; program?: string | null; created_at: string }> }
type StaffProductivity = { leaderboard: StaffLeaderboardEntry[]; summary: StaffSummary; quick: StaffQuick; period: '7' | '30' | '90' | 'ytd' | 'all' }
type ProgramListItem = { id: number; name: string }

type Props = { staffProductivity?: StaffProductivity; programList?: ProgramListItem[] }

export default function StaffDashboard({ staffProductivity, programList = [] }: Props) {
  const sp: StaffProductivity = staffProductivity ?? {
    leaderboard: [],
    summary: { total_active_faculty: 0, avg_research_per_faculty: 0, faculty_without_involvement: 0, most_active_program_this_month: null },
    quick: { research_week: 0, research_month: 0, unaligned_month: 0, recent: [] },
    period: '30',
  }
  const [staffPeriod, setStaffPeriod] = useState<'7' | '30' | '90' | 'ytd' | 'all'>(sp.period)
  const [staffPosition, setStaffPosition] = useState<string>('')
  const [staffView, setStaffView] = useState<'list' | 'chart' | 'grid'>('list')
  const [staffProgramId, setStaffProgramId] = useState<string>('')

  const staffLeaderboard = useMemo(() => {
    const pid = Number(staffProgramId)
    const base = sp.leaderboard.map((l) => {
      if (!pid) return l
      const adv = l.programBreakdown.advised.find((x) => x.program_id === pid)?.count ?? 0
      const pnl = l.programBreakdown.paneled.find((x) => x.program_id === pid)?.count ?? 0
      return { ...l, advised: adv, paneled: pnl, total: adv + pnl }
    })
    return base
      .filter((l) => !staffPosition || (l.position || '') === staffPosition)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [sp, staffProgramId, staffPosition])

  return (
    <AppLayout>
      <Head title="Dashboard" />
      <div className="space-y-6 p-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MCIIS Staff Dashboard</h1>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Department/Position</div>
            <Select value={staffPosition} onValueChange={setStaffPosition}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {Array.from(new Set(sp.leaderboard.map(l => l.position).filter(Boolean))).map((pos) => (
                  <SelectItem key={pos as string} value={String(pos)}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Program</div>
            <Select value={staffProgramId} onValueChange={setStaffProgramId}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {programList.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Time Period</div>
            <Select value={staffPeriod} onValueChange={(v: '7' | '30' | '90' | 'ytd' | 'all') => { setStaffPeriod(v); router.get('/dashboard', { leaderboard_period: v }, { preserveState: true, preserveScroll: true }) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">View</div>
            <Select value={staffView} onValueChange={(v: 'list' | 'chart' | 'grid') => setStaffView(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="chart">Chart</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {staffView === 'list' && (
          <div className="space-y-3">
            {staffLeaderboard.map((l, idx) => {
              const max = Math.max(...sp.leaderboard.map(x => x.total)) || 1
              const advisedPct = Math.round((l.advised / max) * 100)
              const paneledPct = Math.round((l.paneled / max) * 100)
              const medal = idx < 3
              return (
                <div key={l.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">#{idx + 1}</span>
                      {medal && <Award className={`h-4 w-4 ${idx===0?'text-yellow-500':idx===1?'text-gray-400':'text-amber-700'}`} />}
                      <Button variant="link" onClick={() => router.visit(`/faculty/${l.id}`)} className="px-0">{l.name}</Button>
                      {l.position && <span className="text-xs text-muted-foreground">{l.position}</span>}
                    </div>
                    <div className="text-sm font-semibold">Total: {l.total}</div>
                  </div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs">Advised</span><Button variant="ghost" size="sm" onClick={() => router.get('/research', { adviser: l.id }, { preserveScroll: true })}>{l.advised}</Button></div>
                    <div className="h-2 w-full bg-muted rounded"><div className="h-2 bg-blue-500 rounded" style={{ width: `${advisedPct}%` }} /></div>
                    <div className="flex items-center justify-between"><span className="text-xs">Paneled</span><Button variant="ghost" size="sm" onClick={() => router.get('/research', { panelist: l.id }, { preserveScroll: true })}>{l.paneled}</Button></div>
                    <div className="h-2 w-full bg-muted rounded"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${paneledPct}%` }} /></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex items-center justify-between"><span>Total active faculty</span><span className="text-muted-foreground">{sp.summary.total_active_faculty}</span></div>
                <div className="flex items-center justify-between"><span>Average research per faculty</span><span className="text-muted-foreground">{sp.summary.avg_research_per_faculty}</span></div>
                <div className="flex items-center justify-between"><span>Faculty without involvement</span><span className="text-muted-foreground">{sp.summary.faculty_without_involvement}</span></div>
                <div className="flex items-center justify-between"><span>Most active program (month)</span><span className="text-muted-foreground">{sp.summary.most_active_program_this_month ?? '-'}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Research Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <div className="flex items-center justify-between"><span>This week</span><span className="text-muted-foreground">{sp.quick.research_week}</span></div>
                <div className="flex items-center justify-between"><span>This month</span><span className="text-muted-foreground">{sp.quick.research_month}</span></div>
                <div className="flex items-center justify-between"><span>Untagged (month)</span><span className="text-muted-foreground">{sp.quick.unaligned_month}</span></div>
                <div className="mt-2">
                  <div className="text-sm mb-2">Recently added</div>
                  <div className="space-y-1">
                    {sp.quick.recent.map((r) => (
                      <div key={r.id} className="flex items-center justify-between"><Button variant="link" className="px-0" onClick={() => router.visit(`/research/${r.id}`)}>{r.title}</Button><span className="text-xs text-muted-foreground">{r.program ?? '-'}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => router.visit('/research/create')}>Add Research Entry</Button>
          <Button variant="outline" onClick={() => router.visit('/research')}>Manage Research</Button>
          <Button variant="outline" onClick={() => router.visit('/reports')}>Generate Productivity Report</Button>
          <Button variant="outline" onClick={() => router.visit('/faculty')}>View Faculty List</Button>
        </div>
      </div>
    </AppLayout>
  )
}
