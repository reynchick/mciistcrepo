import { useEffect, useState } from 'react'
import { Head, router, useRemember } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import FacultyStatsOverviewCard from '@/components/dashboard/widgets/kpi-overview-card'
import FacultyResearchTable from '@/components/dashboard/charts/faculty-count-table'
import TopFacultyCard, { PALETTE_PANELIST } from '@/components/dashboard/charts/top-faculty-card'
import FilterSidebar from '@/components/browse/research-filters'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Summary = {
  totalFaculty: number
  totalResearch: number
  lastUpdated: string | null
}

type FacultyCharts = {
  advisedIds: number[]
  advisedLabels: string[]
  advisedEmails: string[]
  advisedPositions: string[]
  advisedCounts: number[]
  paneledIds: number[]
  paneledLabels: string[]
  paneledEmails: string[]
  paneledPositions: string[]
  paneledCounts: number[]
}

type RankingEntry = {
  id: number
  name: string
  count: number
}

type DashboardFilters = {
  years: number[]
  topAdviserYear: number | null
  topPanelistYear: number | null
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


function formatLastUpdated(value?: string | null): string {
  if (!value) return '—'
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
    advisedEmails: [],
    advisedPositions: [],
    advisedCounts: [],
    paneledIds: [],
    paneledLabels: [],
    paneledEmails: [],
    paneledPositions: [],
    paneledCounts: [],
  }
  const [showFilters, setShowFilters] = useRemember(false, 'staff.dashboard.showFilters')
  const [selectedYears, setSelectedYears] = useState<number[]>(filters?.years ?? [])
  const [adviserYear, setAdviserYear] = useState<number | 'all'>(filters?.topAdviserYear ?? 'all')
  const [panelistYear, setPanelistYear] = useState<number | 'all'>(filters?.topPanelistYear ?? 'all')

  useEffect(() => {
    setSelectedYears(filters?.years ?? [])
    setAdviserYear(filters?.topAdviserYear ?? 'all')
    setPanelistYear(filters?.topPanelistYear ?? 'all')
  }, [filters?.years, filters?.topAdviserYear, filters?.topPanelistYear])

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

  const handleAdviserYearChange = (year: number | 'all') => {
    setAdviserYear(year)

    const params: Record<string, string | number | (string | number)[]> = {}
    if (selectedYears.length > 0) params.year = selectedYears
    if (year !== 'all') params.topAdviserYear = year
    if (panelistYear !== 'all') params.topPanelistYear = panelistYear

    router.get('/staff/dashboard', params, {
      preserveState: true,
      preserveScroll: true,
      only: ['topAdvisers', 'filters'],
    })
  }

  const handlePanelistYearChange = (year: number | 'all') => {
    setPanelistYear(year)

    const params: Record<string, string | number | (string | number)[]> = {}
    if (selectedYears.length > 0) params.year = selectedYears
    if (adviserYear !== 'all') params.topAdviserYear = adviserYear
    if (year !== 'all') params.topPanelistYear = year

    router.get('/staff/dashboard', params, {
      preserveState: true,
      preserveScroll: true,
      only: ['topPanelists', 'filters'],
    })
  }

  const yearOptions = filterOptions?.years.map((y) => y.year) ?? []

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
            {/* KPI overview: total faculty, total research, last updated */}
            <FacultyStatsOverviewCard
              totalFaculty={stats.totalFaculty}
              totalResearch={stats.totalResearch}
              lastUpdated={formatLastUpdated(stats.lastUpdated)}
              facultyHref="/staff/faculty"
              researchHref="/staff/research"
            />

         
            <div className="mt-6">
              <FacultyResearchTable
                advised={{
                  facultyIds: charts.advisedIds,
                  labels: charts.advisedLabels,
                  emails: charts.advisedEmails,
                  positions: charts.advisedPositions,
                  counts: charts.advisedCounts,
                }}
                paneled={{
                  facultyIds: charts.paneledIds,
                  labels: charts.paneledLabels,
                  emails: charts.paneledEmails,
                  positions: charts.paneledPositions,
                  counts: charts.paneledCounts,
                }}
                emptyMessage="No faculty data available"
                browseResearchHref="/staff/browse"
              />
            </div>

            {/* Pie-chart + Top 5 table, merged into one card each, for Advisers and Panelists side by side */}
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TopFacultyCard
                title="Top 5 Advisers"
                description="Faculty with the most advised research"
                countLabel="Advised"
                labels={topAdvisers.map((e) => e.name)}
                counts={topAdvisers.map((e) => e.count)}
                facultyIds={topAdvisers.map((e) => e.id)}
                linkParam="adviser"
                emptyMessage="No faculty with advised research found"
                years={yearOptions}
                selectedYear={adviserYear}
                onYearChange={handleAdviserYearChange}
              />

              <TopFacultyCard
                title="Top 5 Panelists"
                description="Faculty with the most panel participations"
                countLabel="Paneled"
                labels={topPanelists.map((e) => e.name)}
                counts={topPanelists.map((e) => e.count)}
                facultyIds={topPanelists.map((e) => e.id)}
                linkParam="panelist"
                emptyMessage="No faculty with panel participation found"
                years={yearOptions}
                selectedYear={panelistYear}
                onYearChange={handlePanelistYearChange}
                palette={PALETTE_PANELIST}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}