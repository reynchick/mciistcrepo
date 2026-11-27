import { useEffect, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import FacultyStatsOverviewCard from '@/components/dashboard/widgets/kpi-overview-card'
import FacultyResearchTable from '@/components/dashboard/charts/faculty-count-table'
import TopFacultyCard, { PALETTE_PANELIST } from '@/components/dashboard/charts/top-faculty-card'
import { Check, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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


// Small square checkbox indicator used in the year checklist
function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked ? 'border-[#0047AB] bg-[#0047AB] text-white' : 'border-input bg-background'
      }`}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </span>
  )
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
  // Filter panel floats under the icon button (like the Top 5 "All years" dropdown) instead of opening inside the page
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedYears, setSelectedYears] = useState<number[]>(filters?.years ?? [])
  // Checklist selection is a draft until "Apply" is pressed
  const [draftYears, setDraftYears] = useState<number[]>(filters?.years ?? [])

  useEffect(() => {
    if (isFilterOpen) setDraftYears(selectedYears)
  }, [isFilterOpen, selectedYears])
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
  const activeFilterCount = selectedYears.length

  // Same filter logic as before (years array, applied through the same handlers); the UI is a checklist with Clear / Apply
  const toggleDraftYear = (year: number) => {
    setDraftYears((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]))
  }

  const applyDraft = () => {
    if (draftYears.length > 0) handleApplyFilters({ years: draftYears })
    else handleResetFilters()
    setIsFilterOpen(false)
  }

  const clearDraft = () => {
    setDraftYears([])
    handleResetFilters()
    setIsFilterOpen(false)
  }

  const rowClasses =
    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none'

  return (
    <AppLayout>
      <Head title="Staff Dashboard" />
      {/* Every card on this page is flat: no shadow and no border.
          The first two selectors cover shadcn cards (data-slot="card"); the rest cover
          cards inside child components that set a shadow class themselves. */}
      <div
        className="space-y-3
          [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:shadow-none
          [&_.shadow]:shadow-none [&_.shadow-xs]:shadow-none [&_.shadow-sm]:shadow-none
          [&_.shadow-md]:shadow-none [&_.shadow-lg]:shadow-none"
      >
        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Faculty Research Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of research activities and statistics</p>
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={activeFilterCount > 0 ? `Open filters (${activeFilterCount} active)` : 'Open filters'}
                title="Filters"
                className="relative shrink-0 self-start px-4 shadow-none sm:self-auto"
              >
                <ListFilter className="size-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-[#0047AB] text-[10px] font-semibold leading-none text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="max-h-96 w-56 overflow-y-auto rounded-xl border-0 bg-popover p-1.5 shadow-lg ring-1 ring-black/5"
            >
              <div role="group" aria-label="Filter by year">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={draftYears.length === 0}
                  className={rowClasses}
                  onClick={() => setDraftYears([])}
                >
                  All Years
                  <CheckBox checked={draftYears.length === 0} />
                </button>
                {yearOptions.map((year) => {
                  const checked = draftYears.includes(year)
                  return (
                    <button
                      key={year}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      className={rowClasses}
                      onClick={() => toggleDraftYear(year)}
                    >
                      {year}
                      <CheckBox checked={checked} />
                    </button>
                  )
                })}
              </div>

              <div className="mt-1.5 flex items-center gap-2 border-t border-border/60 pt-2">
                <Button type="button" variant="outline" size="sm" className="flex-1 shadow-none" onClick={clearDraft}>
                  Clear
                </Button>
                <Button type="button" size="sm" className="flex-1" onClick={applyDraft}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            {/* KPI overview: total research, total faculty, last updated */}
            <FacultyStatsOverviewCard
              totalFaculty={stats.totalFaculty}
              totalResearch={stats.totalResearch}
              lastUpdated={formatLastUpdated(stats.lastUpdated)}
              facultyHref="/staff/faculty"
              researchHref="/staff/research"
            />

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

            {/* Pie-chart + Top 5 table, merged into one card each, for Advisers and Panelists side by side */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                browseResearchHref="/staff/browse"
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
                browseResearchHref="/staff/browse"
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}