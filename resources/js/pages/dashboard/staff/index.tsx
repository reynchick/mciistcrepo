import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FacultyRanking, { type RankingEntry } from '@/components/dashboard/widgets/faculty-ranking'
import { Users, FileText, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Summary = {
  totalFaculty: number
  totalResearch: number
  lastUpdated: string | null
}

type Props = {
  summary?: Summary
  topAdvisers?: RankingEntry[]
  topPanelists?: RankingEntry[]
}

/**
 * Format the most-recent-update timestamp as e.g. "Jul 16, 2026 at 7:54 AM".
 * The backend hands us a local datetime string (SQLite "Y-m-d H:i:s"); we
 * normalise the space to a "T" so it parses as local time everywhere.
 */
function formatLastUpdated(value?: string | null): string {
  if (!value) return '—'
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return '—'
  const date = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} at ${time}`
}

export default function StaffDashboard({ summary, topAdvisers = [], topPanelists = [] }: Props) {
  const stats: Summary = summary ?? { totalFaculty: 0, totalResearch: 0, lastUpdated: null }
  const [refreshing, setRefreshing] = useState(false)

  const refresh = () =>
    router.reload({
      preserveScroll: true,
      onStart: () => setRefreshing(true),
      onFinish: () => setRefreshing(false),
    })

  return (
    <AppLayout>
      <Head title="Staff Dashboard" />
      <div className="space-y-6 p-4 sm:p-6">
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Faculty Research Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of research activities and statistics</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="self-start sm:self-auto">
            <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Summary cards: 3-up -> 2-up -> 1-up */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Faculty
              </CardTitle>
              <CardDescription>Active faculty members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalFaculty.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Research
              </CardTitle>
              <CardDescription>Active research entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalResearch.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Updated
              </CardTitle>
              <CardDescription>Most recent research update</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">{formatLastUpdated(stats.lastUpdated)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking panels: side-by-side with a divider, stacked on mobile */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x md:divide-border">
              <div className="md:pr-6 lg:pr-8">
                <FacultyRanking
                  title="Top 5 Advisers"
                  subtitle="Faculty members with the highest number of advised research projects"
                  entries={topAdvisers}
                  emptyMessage="No faculty with advised research found"
                />
              </div>
              <div className="mt-6 border-t pt-6 md:mt-0 md:border-t-0 md:pt-0 md:pl-6 lg:pl-8">
                <FacultyRanking
                  title="Top 5 Panelists"
                  subtitle="Faculty members with the highest number of panel participations"
                  entries={topPanelists}
                  emptyMessage="No faculty with panel participation found"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
