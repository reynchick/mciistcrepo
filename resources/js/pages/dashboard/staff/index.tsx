import { useEffect, useState } from 'react'
import { Head, router, useRemember } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import FacultyRanking, { type RankingEntry } from '@/components/dashboard/widgets/faculty-ranking'
import FacultyCountBarChart from '@/components/dashboard/charts/faculty-count-bar-chart'
import FilterSidebar from '@/components/browse/research-filters'
import { Users, FileText, Clock, Filter } from 'lucide-react'

type Summary = {
  totalFaculty: number
  totalResearch: number
  lastUpdated: string | null
}

type FacultyCharts = {
  advisedIds: number[]
  advisedLabels: string[]
  advisedCounts: number[]
  paneledIds: number[]
  paneledLabels: string[]
  paneledCounts: number[]
}

type DashboardFilters = {
  years: number[]
}

type FilterOption = {
  id?: number
  year?: number
  name?: string
  code?: string
}

type Props = {
  summary?: Summary
  topAdvisers?: RankingEntry[]
  topPanelists?: RankingEntry[]
  facultyCharts?: FacultyCharts
  filters?: DashboardFilters
  filterOptions?: {
    years: Array<{ year: number; count: number }>
  }
}

/**
 * Format the most-recent-update timestamp as e.g. "Jul 16, 2026 at 7:54 AM".
 * The backend hands us a local datetime string (SQLite "Y-m-d H:i:s"); we
 * normalise the space to a "T" so it parses as local time everywhere.
 */
function formatLastUpdated(value?: string | null): string {
  if ( !value) return '—'
  const parsed = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(parsed.getTime())) return '—'
  const date = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = parsed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} at ${time}`
}

export default function StaffDashboard({ summary, topAdvisers = [], topPanelists = [], facultyCharts, filters, filterOptions }: Props) {
  const stats: Summary = summary ?? { totalFaculty: 0, totalResearch: 0, lastUpdated: null }
  const charts: FacultyCharts = facultyCharts ?? {
    advisedIds: [],
    advisedLabels: [],
    advisedCounts: [],
    paneledIds: [],
    paneledLabels: [],
    paneledCounts: [],
  }
  const [showFilters, setShowFilters] = useRemember(false, 'staff.dashboard.showFilters')
  const [selectedYears, setSelectedYears] = useState<number[]>(filters?.years ?? [])

  useEffect(() => {
    setSelectedYears(filters?.years ?? [])
  }, [filters?.years])

  const handleApplyFilters = (newFilters: { years: number[] }) => {
    const params = new URLSearchParams()

    if (newFilters.years.length > 0) {
      newFilters.years.forEach((year) => params.append('year[]', String(year)))
    }

    router.get(`/staff/dashboard${params.toString() ? `?${params.toString()}` : ''}`, {}, {
      preserveState: true,
      preserveScroll: false,
    })
  }

  const handleResetFilters = () => {
    setSelectedYears([])
    router.get('/staff/dashboard', {}, {
      preserveState: true,
      preserveScroll: false,
    })
  }

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
          <Button variant="outline" size="sm" onClick={() => setShowFilters((value) => !value)} className="self-start sm:self-auto">
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <div className="flex gap-6">
          {showFilters && (
            <div className="hidden flex-shrink-0 lg:block lg:w-72">
              <div className="sticky top-6">
                <FilterSidebar
                  filterOptions={{
                    years: (filterOptions?.years ?? []).map((option) => ({ year: option.year, count: option.count })),
                    programs: [],
                    advisers: [],
                  }}
                  currentFilters={{ years: selectedYears, programs: [], advisers: [] }}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                  isMobile={false}
                  showProgramFilter={false}
                  showAdviserFilter={false}
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
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

            {/* Per-faculty bar charts: two columns on desktop, stacked on tablet/mobile */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FacultyCountBarChart
                title="Research Advised per Faculty"
                description="Number of research projects advised by each faculty member"
                labels={charts.advisedLabels}
                counts={charts.advisedCounts}
                facultyIds={charts.advisedIds}
                linkParam="adviser"
                color="rgba(59, 130, 246, 0.85)"
                hoverColor="rgba(37, 99, 235, 1)"
                legendLabel="Researches Advised"
                emptyMessage="No faculty data available"
              />
              <FacultyCountBarChart
                title="Research Paneled per Faculty"
                description="Number of research panels each faculty member has participated in"
                labels={charts.paneledLabels}
                counts={charts.paneledCounts}
                facultyIds={charts.paneledIds}
                linkParam="panelist"
                color="rgba(16, 185, 129, 0.85)"
                hoverColor="rgba(5, 150, 105, 1)"
                legendLabel="Researches Paneled"
                emptyMessage="No faculty data available"
              />
            </div>

            {/* Ranking panels: two separate cards side-by-side, stacked on mobile */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <FacultyRanking
                    title="Top 5 Advisers"
                    subtitle="Faculty members with the highest number of advised research projects"
                    entries={topAdvisers}
                    emptyMessage="No faculty with advised research found"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <FacultyRanking
                    title="Top 5 Panelists"
                    subtitle="Faculty members with the highest number of panel participations"
                    entries={topPanelists}
                    emptyMessage="No faculty with panel participation found"
                  />
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
