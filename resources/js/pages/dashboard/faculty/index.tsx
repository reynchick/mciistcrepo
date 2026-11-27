import { useEffect, useMemo, useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import YearBarChart from '@/components/dashboard/charts/year-bar-chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ListFilter } from 'lucide-react'

type AlignmentType = 'agenda' | 'sdg' | 'srig'

type FacultyStats = {
  totals: { advised: number; paneled: number }
  recent?: Array<{ id: number | string; title: string; program?: string; status?: 'ongoing' | 'completed'; year?: number; role?: 'adviser' | 'panelist' }>
  yearlyTrendAdvised?: Array<{ year: number; count: number }>
  yearlyTrendPaneled?: Array<{ year: number; count: number }>
  alignmentSummary?: Array<{ type: AlignmentType; label: string; count: number; percentage: number }>
  alignmentBreakdown?: Array<{ type: AlignmentType; name: string; code: string; count: number; percentage: number; order_key: string }>
  alignmentTotal?: number
  lastUpdated?: string
}

type SharedData = {
  auth: {
    user: {
      first_name: string
      middle_name?: string | null
      last_name: string
      faculty_id?: number | string | null
    }
  }
}

type Props = {
  facultyStats?: FacultyStats
  filterOptions?: {
    years: Array<{ year: number; count: number }>
    programs: Array<{ id: number; name: string; code: string | null; research_count: number }>
  }
  filters?: { years: number[]; programs: number[] }
}

const ALL = '__all__'

function getInitialYears(): number[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  return params.getAll('year[]').map((value) => Number(value)).filter((value) => !Number.isNaN(value))
}

const COVERAGE_ORDER: Array<{ type: AlignmentType; label: string }> = [
  { type: 'agenda', label: 'Agenda' },
  { type: 'sdg', label: 'SDG' },
  { type: 'srig', label: 'SRIG' },
]

const KPI_STYLES = {
  blue: {
    card: 'bg-gradient-to-br from-[#0B5CCB] via-[#0047AB] to-[#003B91] text-white',
    title: 'text-white',
    icon: 'text-white',
    caption: 'text-white/80',
  },
  yellow: {
    card: 'bg-gradient-to-br from-[#FFD84D] via-[#FDC500] to-[#E6B000] text-slate-900',
    title: 'text-slate-900',
    icon: 'text-black',
    caption: 'text-slate-900/70',
  },
} as const

/** User icon: a circle outline with a head and shoulders whose arc meets the circle edge. */
function UserBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="15" />
      <circle cx="16" cy="12.5" r="4.5" />
      <path d="M5 26.2C7 21.5 11 19.5 16 19.5C21 19.5 25 21.5 27 26.2" />
    </svg>
  )
}

/** Same gradient look as the "Total Research" card on the admin dashboard. */
function KpiCard({
  title,
  value,
  caption,
  onClick,
  variant = 'blue',
}: {
  title: string
  value: number
  caption: string
  onClick: () => void
  variant?: keyof typeof KPI_STYLES
}) {
  const styles = KPI_STYLES[variant]

  return (
    <Card
      className={`cursor-pointer overflow-hidden border-0 shadow-none transition-opacity hover:opacity-95 ${styles.card}`}
      onClick={onClick}
    >
      <CardContent className="flex min-h-[184px] flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <p className={`font-sans text-base font-bold ${styles.title}`}>{title}</p>
          <UserBadgeIcon className={`size-8 shrink-0 ${styles.icon}`} />
        </div>
        <p className="text-4xl leading-none font-semibold tracking-tight">{value.toLocaleString()}</p>
        <p className={`font-sans text-xs font-medium ${styles.caption}`}>{caption}</p>
      </CardContent>
    </Card>
  )
}

/** Ring colors react to the parent tile's `group` hover. */
function ProgressRing({ value }: { value: number }) {
  const size = 72
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 transition-colors duration-200 group-hover:stroke-white/25 dark:stroke-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="stroke-[#00509D] group-hover:stroke-[#FDC500]"
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.2s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700 tabular-nums transition-colors duration-200 group-hover:text-white dark:text-slate-200">
        {Math.round(clamped)}%
      </span>
    </div>
  )
}

/** One white wrapper card: title on top, three ring tiles stacked below and sharing the full height. */
function AlignmentCoverage({
  summary,
  title,
}: {
  summary: NonNullable<FacultyStats['alignmentSummary']>
  title: string
}) {
  const items = COVERAGE_ORDER.map(({ type, label }) => {
    const found = summary.find((item) => item.type === type)
    return {
      type,
      label: found?.label ?? label,
      count: found?.count ?? 0,
      percentage: found?.percentage ?? 0,
    }
  })

  return (
    <section className="flex h-full flex-col rounded-2xl bg-white p-4 dark:bg-slate-900">
      <div className="px-1 pb-4 text-center">
        <h2 className="font-sans text-xl leading-snug font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.type}
            className="group flex flex-1 items-center justify-center gap-5 rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-900 transition-colors duration-200 hover:border-transparent hover:bg-gradient-to-br hover:from-[#0B5CCB] hover:via-[#0047AB] hover:to-[#003B91] hover:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <ProgressRing value={item.percentage} />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs text-slate-500 transition-colors duration-200 group-hover:text-white/80">
                {item.count.toLocaleString()} research
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function FacultyDashboard({ facultyStats, filterOptions, filters }: Props) {
  const fs: FacultyStats = facultyStats ?? {
    totals: { advised: 0, paneled: 0 },
    recent: [],
    yearlyTrendAdvised: [],
    yearlyTrendPaneled: [],
    alignmentSummary: [],
    alignmentBreakdown: [],
    alignmentTotal: 0,
    lastUpdated: '',
  }
  const { auth } = usePage<SharedData>().props
  const [selectedYears, setSelectedYears] = useState<number[]>(() => getInitialYears())
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([])
  const [chartRole, setChartRole] = useState<'advised' | 'paneled'>('advised')
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    setSelectedYears(filters?.years ?? getInitialYears())
    setSelectedPrograms(filters?.programs ?? [])
  }, [filters?.years, filters?.programs])

  const yearOptions = useMemo(() => {
    return [...(filterOptions?.years ?? [])].sort((a, b) => b.year - a.year)
  }, [filterOptions?.years])

  const years = useMemo(() => yearOptions.map((option) => option.year), [yearOptions])
  const startYear = selectedYears.length > 0 ? Math.min(...selectedYears) : years.length > 0 ? Math.min(...years) : new Date().getFullYear()
  const endYear = selectedYears.length > 0 ? Math.max(...selectedYears) : years.length > 0 ? Math.max(...years) : new Date().getFullYear()

  const applyRange = (start: number, end: number, programs = selectedPrograms) => {
    const min = Math.min(start, end)
    const max = Math.max(start, end)
    const nextYears = Array.from({ length: max - min + 1 }, (_, index) => min + index)
    setSelectedYears(nextYears)

    const params: Record<string, number | number[]> = { year_start: min, year_end: max }
    if (programs.length > 0) params.program = programs
    router.get('/dashboard', params, { preserveState: true, preserveScroll: true })
  }

  const applyProgram = (program: number | null) => {
    const nextPrograms = program === null ? [] : [program]
    setSelectedPrograms(nextPrograms)
    applyRange(startYear, endYear, nextPrograms)
  }

  const activeTabClass =
    'data-[state=on]:bg-[#FDC500] data-[state=on]:text-slate-900 data-[state=on]:hover:bg-[#FDC500]/90'

  const viewControls = (
    <div className="flex items-center gap-2">
      <ToggleGroup
        type="single"
        value={chartRole}
        onValueChange={(value) => value && setChartRole(value as 'advised' | 'paneled')}
        variant="outline"
        aria-label="Research activity view"
        className="h-9 data-[variant=outline]:shadow-none"
      >
        <ToggleGroupItem value="advised" aria-label="Show advised research" className={activeTabClass}>
          Advised
        </ToggleGroupItem>
        <ToggleGroupItem value="paneled" aria-label="Show paneled research" className={activeTabClass}>
          Paneled
        </ToggleGroupItem>
      </ToggleGroup>

      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="Open filters" className="shadow-none">
            <ListFilter className="size-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program-filter">Program</Label>
              <Select
                value={selectedPrograms[0] ? String(selectedPrograms[0]) : ALL}
                onValueChange={(value) => applyProgram(value === ALL ? null : Number(value))}
              >
                <SelectTrigger id="program-filter" className="w-full shadow-none">
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Programs</SelectItem>
                  {(filterOptions?.programs ?? []).map((program) => (
                    <SelectItem key={program.id} value={String(program.id)} title={program.name}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year Range</Label>
              <div className="flex items-center gap-2">
                <Select value={String(startYear)} onValueChange={(value) => applyRange(Number(value), endYear)}>
                  <SelectTrigger className="w-full shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm text-muted-foreground">to</span>

                <Select value={String(endYear)} onValueChange={(value) => applyRange(startYear, Number(value))}>
                  <SelectTrigger className="w-full shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )

  const filteredAdvisedCount = useMemo(() => {
    const source = fs.yearlyTrendAdvised ?? []
    if (selectedYears.length === 0) {
      return source.reduce((sum, item) => sum + item.count, 0)
    }

    return source.filter((item) => selectedYears.includes(item.year)).reduce((sum, item) => sum + item.count, 0)
  }, [fs.yearlyTrendAdvised, selectedYears])

  const filteredPaneledCount = useMemo(() => {
    const source = fs.yearlyTrendPaneled ?? []
    if (selectedYears.length === 0) {
      return source.reduce((sum, item) => sum + item.count, 0)
    }

    return source.filter((item) => selectedYears.includes(item.year)).reduce((sum, item) => sum + item.count, 0)
  }, [fs.yearlyTrendPaneled, selectedYears])

  const browseHref = (role: 'adviser' | 'panelist') => {
    const params = new URLSearchParams()
    selectedYears.forEach((year) => params.append('years[]', String(year)))
    selectedPrograms.forEach((program) => params.append('programs[]', String(program)))
    if (role === 'adviser') params.append('advisers[]', String(auth.user.faculty_id ?? ''))
    if (role === 'panelist') params.set('panelist', String(auth.user.faculty_id ?? ''))
    return `/faculty/browse?${params.toString()}`
  }

  return (
    <AppLayout>
      <Head title="Faculty Dashboard" />
      <div className="space-y-4">
        <div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Faculty Research Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of your research activities and statistics</p>
          </div>
        </div>

        {/* Left: KPI cards + Research Activity. Right: alignment wrapper spanning the full height. */}
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <KpiCard
                title="Research Advised"
                value={filteredAdvisedCount}
                caption="Your advised research activity"
                onClick={() => router.visit(browseHref('adviser'))}
              />
              <KpiCard
                title="Research Paneled"
                value={filteredPaneledCount}
                caption="Your paneled research activity"
                variant="yellow"
                onClick={() => router.visit(browseHref('panelist'))}
              />
            </div>

            <Card className="shadow-none">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle>Research Activity</CardTitle>
                    <CardDescription>{startYear}–{endYear}</CardDescription>
                  </div>
                  {viewControls}
                </div>
              </CardHeader>
              <CardContent>
                {chartRole === 'advised' ? (
                  <YearBarChart
                    flush
                    data={(fs.yearlyTrendAdvised ?? []).map((item) => ({ ...item, topAlignments: [] }))}
                    color="#23568D"
                    tooltipTitlePrefix="Advised"
                    browseResearchHref="/faculty/browse"
                    browseQuery={{ key: 'advisers[]', value: auth.user.faculty_id ?? '' }}
                  />
                ) : (
                  <YearBarChart
                    flush
                    data={(fs.yearlyTrendPaneled ?? []).map((item) => ({ ...item, topAlignments: [] }))}
                    color="#4EBDAC"
                    tooltipTitlePrefix="Paneled"
                    browseResearchHref="/faculty/browse"
                    browseQuery={{ key: 'panelist', value: auth.user.faculty_id ?? '' }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="min-w-0">
            <AlignmentCoverage
              summary={fs.alignmentSummary ?? []}
              title="Alignment of Advised Research"
            />
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}